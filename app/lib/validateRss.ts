import Parser from 'rss-parser';

const parser = new Parser();

export interface RssValidationResult {
    isValid: boolean;
    error?: string;
    feedTitle?: string;
    itemCount?: number;
}

/**
 * Validates an RSS feed URL by attempting to parse it
 * @param feedUrl - The RSS feed URL to validate
 * @returns Promise with validation result
 */
export async function validateRssFeed(feedUrl: string): Promise<RssValidationResult> {
    try {
        // Basic URL validation
        if (!feedUrl || typeof feedUrl !== 'string') {
            return {
                isValid: false,
                error: 'RSS feed URL is required',
            };
        }

        // Ensure it's a valid URL
        let url: URL;
        try {
            url = new URL(feedUrl);
        } catch {
            return {
                isValid: false,
                error: 'Invalid URL format',
            };
        }

        // Ensure it's HTTP or HTTPS
        if (!['http:', 'https:'].includes(url.protocol)) {
            return {
                isValid: false,
                error: 'RSS feed URL must use HTTP or HTTPS protocol',
            };
        }

        // Try to parse the RSS feed
        const feed = await parser.parseURL(feedUrl);

        // Check if feed has basic required properties
        if (!feed.title) {
            return {
                isValid: false,
                error: 'RSS feed is missing required title field',
            };
        }

        return {
            isValid: true,
            feedTitle: feed.title,
            itemCount: feed.items?.length || 0,
        };
    } catch (error) {
        console.error('RSS validation error:', error);

        // Provide user-friendly error messages
        if (error instanceof Error) {
            if (error.message.includes('fetch')) {
                return {
                    isValid: false,
                    error: 'Unable to fetch RSS feed. Please check the URL and try again.',
                };
            }
            if (error.message.includes('parse') || error.message.includes('Invalid')) {
                return {
                    isValid: false,
                    error: 'The URL does not contain a valid RSS feed format.',
                };
            }
            return {
                isValid: false,
                error: `RSS validation failed: ${error.message}`,
            };
        }

        return {
            isValid: false,
            error: 'Failed to validate RSS feed. Please ensure the URL is correct and accessible.',
        };
    }
}
