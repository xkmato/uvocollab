import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: 'UvoCollab - Connect Rising Artists with Music Industry Legends',
    template: '%s | UvoCollab'
  },
  description: 'UvoCollab is a curated marketplace connecting emerging artists with verified music industry professionals. Secure collaborations with escrow payments, legal contracts, and project management for verses, features, production, mixing, and more.',
  keywords: [
    'music collaboration platform',
    'music industry marketplace',
    'hire music producers',
    'artist collaboration',
    'music feature marketplace',
    'verified music professionals',
    'music production services',
    'mixing and mastering services',
    'songwriting collaboration',
    'music industry networking',
    'rap verse marketplace',
    'music contract platform',
    'escrow music payments',
    'hip hop collaboration',
    'R&B collaboration',
    'music industry legends',
    'professional music services',
    'artist features',
    'music production marketplace'
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
    title: 'UvoCollab - Connect Rising Artists with Music Industry Legends',
    description: 'Secure music collaboration platform connecting emerging artists with verified industry professionals. Features, verses, production, and more with escrow payments and legal contracts.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UvoCollab - Music Collaboration Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UvoCollab - Connect Rising Artists with Music Industry Legends',
    description: 'Secure music collaboration platform connecting emerging artists with verified industry professionals.',
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
  category: 'music',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "UvoCollab",
              "url": "https://uvocollab.com",
              "description": "Connect rising artists with music industry legends",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://uvocollab.com/marketplace?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
