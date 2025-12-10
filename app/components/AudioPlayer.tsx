'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

export default function AudioPlayer() {
    const {
        currentEpisode,
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackRate,
        togglePlayPause,
        seek,
        setVolume,
        setPlaybackRate,
        closePlayer,
    } = useAudioPlayer();

    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const volumeRef = useRef<HTMLDivElement>(null);
    const speedRef = useRef<HTMLDivElement>(null);

    // Close volume slider and speed menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
                setShowVolumeSlider(false);
            }
            if (speedRef.current && !speedRef.current.contains(event.target as Node)) {
                setShowSpeedMenu(false);
            }
        };

        if (showVolumeSlider || showSpeedMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showVolumeSlider, showSpeedMenu]);

    if (!currentEpisode) return null;

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        seek(newTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };

    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 to-purple-800 shadow-2xl border-t border-purple-700 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3">
                {/* Main Player Row */}
                <div className="flex items-center gap-4">
                    {/* Episode Info */}
                    <div className="flex items-center gap-3 flex-shrink-0 md:w-64 flex-1 md:flex-initial min-w-0">
                        {currentEpisode.imageUrl && (
                            <div className="w-12 h-12 rounded-md overflow-hidden shadow-lg relative flex-shrink-0">
                                <Image
                                    src={currentEpisode.imageUrl}
                                    alt={currentEpisode.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                                {currentEpisode.title}
                            </p>
                            {currentEpisode.podcastTitle && (
                                <p className="text-purple-200 text-xs truncate">
                                    {currentEpisode.podcastTitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Player Controls - Desktop */}
                    <div className="hidden md:flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={togglePlayPause}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-full hover:bg-purple-50 transition-colors shadow-lg flex-shrink-0"
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? (
                                    <svg className="w-5 h-5 text-purple-900" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-purple-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            {/* Progress Bar */}
                            <div className="flex-1 flex items-center gap-3">
                                <span className="text-xs text-purple-200 font-medium w-10 text-right">
                                    {formatTime(currentTime)}
                                </span>
                                <div className="relative flex-1 h-1.5 bg-purple-700 rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                        aria-label="Seek"
                                    />
                                </div>
                                <span className="text-xs text-purple-200 font-medium w-10">
                                    {formatTime(duration)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Play/Pause Button - Mobile Only */}
                    <button
                        onClick={togglePlayPause}
                        className="md:hidden w-10 h-10 flex items-center justify-center bg-white rounded-full hover:bg-purple-50 transition-colors shadow-lg flex-shrink-0"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <svg className="w-5 h-5 text-purple-900" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-purple-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Expand/Collapse Button - Mobile Only */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="md:hidden w-8 h-8 flex items-center justify-center text-white hover:text-purple-200 transition-colors flex-shrink-0"
                        aria-label={isExpanded ? 'Collapse player' : 'Expand player'}
                    >
                        <svg
                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Desktop Controls */}
                    <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                        {/* Playback Speed Control */}
                        <div className="relative" ref={speedRef}>
                            <button
                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                className="w-auto px-2 h-8 flex items-center justify-center text-white hover:text-purple-200 transition-colors text-xs font-semibold"
                                aria-label="Playback speed"
                            >
                                {playbackRate}x
                            </button>
                            {showSpeedMenu && (
                                <div className="absolute bottom-full mb-2 right-0 bg-purple-950 rounded-lg py-1 shadow-xl min-w-[80px]">
                                    {speedOptions.map((speed) => (
                                        <button
                                            key={speed}
                                            onClick={() => {
                                                setPlaybackRate(speed);
                                                setShowSpeedMenu(false);
                                            }}
                                            className={`w-full px-4 py-2 text-sm text-left hover:bg-purple-800 transition-colors ${playbackRate === speed ? 'text-white font-semibold' : 'text-purple-200'
                                                }`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Volume Control */}
                        <div className="relative" ref={volumeRef}>
                            <button
                                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                                className="w-8 h-8 flex items-center justify-center text-white hover:text-purple-200 transition-colors"
                                aria-label="Volume"
                            >
                                {volume === 0 ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                ) : volume < 0.5 ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                )}
                            </button>
                            {showVolumeSlider && (
                                <div className="absolute bottom-full mb-2 right-0 bg-purple-950 rounded-lg p-3 shadow-xl">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="w-24 h-1.5 bg-purple-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
                                        aria-label="Volume slider"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={closePlayer}
                            className="w-8 h-8 flex items-center justify-center text-white hover:text-purple-200 transition-colors"
                            aria-label="Close player"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Expanded Mobile Controls */}
                {isExpanded && (
                    <div className="md:hidden mt-4 pt-4 border-t border-purple-700 space-y-4">
                        {/* Progress Bar - Mobile */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-purple-200 font-medium w-10 text-right">
                                {formatTime(currentTime)}
                            </span>
                            <div className="relative flex-1 h-1.5 bg-purple-700 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                    aria-label="Seek"
                                />
                            </div>
                            <span className="text-xs text-purple-200 font-medium w-10">
                                {formatTime(duration)}
                            </span>
                        </div>

                        {/* Mobile Control Buttons */}
                        <div className="flex items-center justify-around gap-4">
                            {/* Playback Speed */}
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-xs text-purple-200">Speed</span>
                                <div className="flex gap-1">
                                    {speedOptions.map((speed) => (
                                        <button
                                            key={speed}
                                            onClick={() => setPlaybackRate(speed)}
                                            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${playbackRate === speed
                                                ? 'bg-white text-purple-900'
                                                : 'bg-purple-700 text-white hover:bg-purple-600'
                                                }`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Volume Control */}
                            <div className="flex flex-col items-center gap-2 flex-1 max-w-[200px]">
                                <span className="text-xs text-purple-200">Volume</span>
                                <div className="flex items-center gap-3 w-full">
                                    <button
                                        onClick={() => setVolume(volume === 0 ? 1 : 0)}
                                        className="text-white hover:text-purple-200 transition-colors"
                                        aria-label="Toggle mute"
                                    >
                                        {volume === 0 ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            </svg>
                                        )}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="flex-1 h-1.5 bg-purple-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
                                        aria-label="Volume slider"
                                    />
                                </div>
                            </div>

                            {/* Close Button */}
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-xs text-purple-200">Close</span>
                                <button
                                    onClick={closePlayer}
                                    className="w-10 h-10 flex items-center justify-center bg-purple-700 hover:bg-purple-600 rounded-full text-white transition-colors"
                                    aria-label="Close player"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
