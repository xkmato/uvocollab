import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ podcastId: string }> }
) {
    try {
        const { podcastId } = await params;

        if (!podcastId) {
            return NextResponse.json({ error: 'Podcast ID is required' }, { status: 400 });
        }

        // Fetch podcast to get RSS feed URL
        const podcastRef = adminDb.collection('podcasts').doc(podcastId);
        const podcastDoc = await podcastRef.get();

        if (!podcastDoc.exists) {
            return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
        }

        const podcastData = podcastDoc.data();
        const rssFeedUrl = podcastData?.rssFeedUrl;

        if (!rssFeedUrl) {
            return NextResponse.json({ error: 'No RSS feed configured for this podcast' }, { status: 404 });
        }

        // Parse RSS feed
        try {
            const feed = await parser.parseURL(rssFeedUrl);

            // Get first 5 episodes
            const episodes = feed.items.slice(0, 5).map(item => ({
                title: item.title || 'Untitled',
                description: item.contentSnippet || item.content || '',
                pubDate: item.pubDate || item.isoDate,
                link: item.link || '',
                audioUrl: item.enclosure?.url || '',
                duration: item.itunes?.duration || '',
                imageUrl: item.itunes?.image || feed.image?.url || '',
            }));

            return NextResponse.json({ episodes });
        } catch (parseError) {
            console.error('RSS parsing error:', parseError);
            return NextResponse.json({
                error: 'Failed to parse RSS feed',
                details: parseError instanceof Error ? parseError.message : 'Unknown error'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error fetching episodes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
