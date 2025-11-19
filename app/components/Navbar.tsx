'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
    const { user, userData, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex items-center gap-1">
                            <div className="h-6 w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full group-hover:h-8 transition-all duration-300"></div>
                            <div className="h-4 w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full group-hover:h-6 transition-all duration-300 delay-75"></div>
                            <div className="h-8 w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full group-hover:h-10 transition-all duration-300 delay-150"></div>
                        </div>
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                            UvoCollab
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            href="/marketplace"
                            className={`text-sm font-medium transition-colors hover:text-white ${isActive('/marketplace') ? 'text-white' : 'text-white/70'}`}
                        >
                            Marketplace
                        </Link>
                        <Link
                            href="/marketplace/podcasts"
                            className={`text-sm font-medium transition-colors hover:text-white ${isActive('/marketplace/podcasts') ? 'text-white' : 'text-white/70'}`}
                        >
                            Podcasts
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className={`text-sm font-medium transition-colors hover:text-white ${isActive('/dashboard') ? 'text-white' : 'text-white/70'}`}
                                >
                                    Dashboard
                                </Link>
                                <div className="h-6 w-px bg-white/10"></div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-white/90">
                                        {userData?.displayName || user.email?.split('@')[0]}
                                    </span>
                                    <button
                                        onClick={() => logout()}
                                        className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/auth/login"
                                    className="text-sm font-medium text-white/70 hover:text-white transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:shadow-lg hover:scale-105 transition-all"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-white/70 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-slate-900 border-b border-white/10">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <Link
                            href="/marketplace"
                            className="block px-3 py-2 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Marketplace
                        </Link>
                        <Link
                            href="/marketplace/podcasts"
                            className="block px-3 py-2 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Podcasts
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="block px-3 py-2 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-base font-medium text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="pt-4 flex flex-col gap-3">
                                <Link
                                    href="/auth/login"
                                    className="block w-full text-center px-4 py-3 text-base font-medium text-white bg-white/10 rounded-xl"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="block w-full text-center px-4 py-3 text-base font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
