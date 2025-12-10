'use client';

import AudioPlayer from './components/AudioPlayer';
import Navbar from './components/Navbar';
import { AudioPlayerProvider, useAudioPlayer } from './contexts/AudioPlayerContext';
import { AuthProvider } from './contexts/AuthContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { currentEpisode } = useAudioPlayer();

    return (
        <>
            <Navbar />
            <div className={currentEpisode ? 'pb-24' : ''}>
                {children}
            </div>
            <AudioPlayer />
        </>
    );
}

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <AudioPlayerProvider>
                <LayoutContent>{children}</LayoutContent>
            </AudioPlayerProvider>
        </AuthProvider>
    );
}