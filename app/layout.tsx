import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import ClientLayout from "./ClientLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://uvocollab.com'),
  title: {
    default: 'UvoCollab - Connect Rising Artists & Podcasters with Industry Legends',
    template: '%s | UvoCollab'
  },
  description: 'UvoCollab is a curated marketplace connecting emerging artists, podcasters, and expert guests with verified industry professionals. Secure collaborations with escrow payments, legal contracts, and project management for production, guest bookings, sponsorships, and more.',
  keywords: [
    'music collaboration platform',
    'podcast collaboration platform',
    'podcast guest marketplace',
    'expert guest booking',
    'podcast guest platform',
    'music and podcast marketplace',
    'hire music producers',
    'hire podcast guests',
    'artist collaboration',
    'music feature marketplace',
    'verified music professionals',
    'verified podcast professionals',
    'verified podcast guests',
    'music production services',
    'mixing and mastering services',
    'songwriting collaboration',
    'music industry networking',
    'podcast guest networking',
    'rap verse marketplace',
    'music contract platform',
    'escrow music payments',
    'hip hop collaboration',
    'R&B collaboration',
    'music industry legends',
    'professional music services',
    'artist features',
    'music production marketplace',
    'podcast guest appearances',
    'expert speakers',
    'thought leader guests',
    'guest interview opportunities'
  ],
  authors: [{ name: 'UvoCollab' }],
  creator: 'UvoCollab',
  publisher: 'UvoCollab',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://uvocollab.com',
    siteName: 'UvoCollab',
    title: 'UvoCollab - Connect Rising Artists, Podcasters & Expert Guests with Industry Legends',
    description: 'Secure collaboration platform connecting emerging artists, podcasters, and expert guests with verified industry professionals. Features, verses, production, guest bookings, sponsorships, and more with escrow payments and legal contracts.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UvoCollab - Music & Podcast Collaboration Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UvoCollab - Connect Rising Artists & Podcasters with Industry Legends',
    description: 'Secure collaboration platform connecting emerging artists and podcasters with verified industry professionals.',
    images: ['/twitter-image.png'],
    creator: '@uvocollab',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://uvocollab.com',
  },
  category: 'music & podcasting',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "UvoCollab",
              "url": "https://uvocollab.com",
              "description": "Connect rising artists and podcasters with industry legends",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://uvocollab.com/marketplace?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
