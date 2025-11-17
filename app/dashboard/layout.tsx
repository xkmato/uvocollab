import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard - Manage Your Collaborations',
    description: 'Manage your music collaborations, track project progress, and communicate with industry legends.',
    robots: {
        index: false,
        follow: true,
    },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
