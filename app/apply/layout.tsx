import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Become a Legend - Apply to Join UvoCollab',
    description: 'Apply to become a verified music or podcast industry professional on UvoCollab. Share your expertise with emerging artists and podcasters, and earn money doing what you love.',
    openGraph: {
        title: 'Become a Legend - Apply to Join UvoCollab',
        description: 'Join an exclusive community of verified music and podcast industry professionals.',
        type: 'website',
        url: 'https://collab.uvotam.com/apply',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Become a Legend - Apply to Join UvoCollab',
        description: 'Join an exclusive community of verified music and podcast industry professionals.',
    },
};

export default function ApplyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
