import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Music & Podcast Marketplace - Find Verified Professionals',
    description: 'Browse and collaborate with verified music and podcast industry legends. Find producers, featured artists, mixing engineers, podcast hosts, and more. Secure payments with escrow protection.',
    openGraph: {
        title: 'Music & Podcast Marketplace - Find Verified Professionals',
        description: 'Discover verified music and podcast professionals for your next collaboration. Features, verses, guest bookings, sponsorships, production, and more.',
        type: 'website',
        url: 'https://collab.uvotam.com/marketplace',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Music & Podcast Marketplace - Find Verified Professionals',
        description: 'Discover verified music and podcast professionals for your next collaboration.',
    },
};

export default function MarketplaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
