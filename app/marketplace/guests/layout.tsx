import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Podcast Guests | Expert Guest Marketplace',
  description: 'Discover verified podcast guests and expert speakers. Browse by topic, rate, and expertise. Connect with thought leaders ready to appear on your podcast.',
  keywords: 'podcast guests, expert guests, guest marketplace, podcast speakers, verified guests, guest booking',
  openGraph: {
    title: 'Browse Podcast Guests | Expert Guest Marketplace',
    description: 'Discover verified podcast guests and expert speakers. Browse by topic, rate, and expertise.',
    type: 'website',
    url: 'https://collab.uvotam.com/marketplace/guests',
  },
};

export default function GuestsMarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
