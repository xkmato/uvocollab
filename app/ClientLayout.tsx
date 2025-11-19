'use client';

import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <Navbar />
            {children}
        </AuthProvider>
    );
}