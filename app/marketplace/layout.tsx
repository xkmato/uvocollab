import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Music Industry Marketplace - Find Verified Professionals',
    description: 'Browse and collaborate with verified music industry legends. Find producers, featured artists, mixing engineers, songwriters, and more. Secure payments with escrow protection.',
    openGraph: {
        title: 'Music Industry Marketplace - Find Verified Professionals',
        description: 'Discover verified music professionals for your next collaboration. Features, verses, production, and more.',
        type: 'website',
        url: 'https://uvocollab.com/marketplace',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Music Industry Marketplace - Find Verified Professionals',
        description: 'Discover verified music professionals for your next collaboration.',
    },
};

export default function MarketplaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
