import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guest Interview Opportunities | Podcast Guest Spots',
  description: 'Browse podcast interview opportunities. Find podcasts actively seeking guests. Apply to appear on shows that match your expertise.',
  keywords: 'podcast opportunities, guest spots, podcast interviews, guest opportunities, podcast guest booking',
  openGraph: {
    title: 'Guest Interview Opportunities | Podcast Guest Spots',
    description: 'Browse podcast interview opportunities. Find podcasts actively seeking guests.',
    type: 'website',
    url: 'https://collab.uvotam.com/opportunities/interviews',
  },
};

export default function InterviewOpportunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
