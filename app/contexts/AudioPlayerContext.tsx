'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface Episode {
    title: string;
    audioUrl: string;
    imageUrl?: string;
    podcastTitle?: string;
}

interface AudioPlayerContextType {
    currentEpisode: Episode | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    playbackRate: number;
    playEpisode: (episode: Episode) => void;
    togglePlayPause: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    setPlaybackRate: (rate: number) => void;
    closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
    }
    return context;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(0.8);
    const [playbackRate, setPlaybackRateState] = useState(1);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio element
    useEffect(() => {
        const audio = new Audio();
        audio.volume = 0.8;
        audioRef.current = audio;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, []);

    const playEpisode = (episode: Episode) => {
        if (!audioRef.current) return;

        const audio = audioRef.current;
        const isSameEpisode = currentEpisode?.audioUrl === episode.audioUrl;

        setCurrentEpisode(episode);

        if (!isSameEpisode) {
            audio.src = episode.audioUrl;
            audio.load();
        }

        audio.play()
            .then(() => setIsPlaying(true))
            .catch((error) => console.error('Error playing audio:', error));
    };

    const togglePlayPause = () => {
        if (!audioRef.current) return;

        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play()
                .then(() => setIsPlaying(true))
                .catch((error) => console.error('Error playing audio:', error));
        }
    };

    const seek = (time: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const setVolume = (newVolume: number) => {
        if (!audioRef.current) return;
        audioRef.current.volume = newVolume;
        setVolumeState(newVolume);
    };

    const setPlaybackRate = (rate: number) => {
        if (!audioRef.current) return;
        audioRef.current.playbackRate = rate;
        setPlaybackRateState(rate);
    };

    const closePlayer = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentEpisode(null);
        setIsPlaying(false);
        setCurrentTime(0);
    };

    return (
        <AudioPlayerContext.Provider
            value={{
                currentEpisode,
                isPlaying,
                currentTime,
                duration,
                volume,
                playbackRate,
                playEpisode,
                togglePlayPause,
                seek,
                setVolume,
                setPlaybackRate,
                closePlayer,
            }}
        >
            {children}
        </AudioPlayerContext.Provider>
    );
};
