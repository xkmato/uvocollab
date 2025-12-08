import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Become a Podcast Guest | UvoCollab',
    description: 'Join UvoCollab as a podcast guest and connect with podcasters worldwide. Share your expertise, build your brand, and monetize your knowledge.',
    keywords: 'podcast guest, guest booking, podcast interviews, expert guest, podcast appearances, guest marketplace',
    openGraph: {
        title: 'Become a Podcast Guest | UvoCollab',
        description: 'Join UvoCollab as a podcast guest and connect with podcasters worldwide. Share your expertise, build your brand, and monetize your knowledge.',
        type: 'website',
        url: 'https://uvocollab.com/guests',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Become a Podcast Guest | UvoCollab',
        description: 'Join UvoCollab as a podcast guest and connect with podcasters worldwide.',
    },
};

export default function GuestsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
