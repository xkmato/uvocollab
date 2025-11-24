import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your UvoCollab account to manage collaborations, browse legends, and connect with music and podcast industry professionals.',
    robots: {
        index: false,
        follow: true,
    },
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
