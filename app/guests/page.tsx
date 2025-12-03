import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Become a Podcast Guest | UvoCollab',
  description: 'Join UvoCollab as a podcast guest and connect with podcasters worldwide. Share your expertise, build your brand, and monetize your knowledge.',
  keywords: 'podcast guest, guest booking, podcast interviews, expert guest, podcast appearances, guest marketplace',
  openGraph: {
    title: 'Become a Podcast Guest | UvoCollab',
    description: 'Join UvoCollab as a podcast guest and connect with podcasters worldwide. Share your expertise, build your brand, and monetize your knowledge.',
    type: 'website',
    url: 'https://uvocollab.com/guests',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Become a Podcast Guest | UvoCollab',
    description: 'Join UvoCollab as a podcast guest and connect with podcasters worldwide.',
  },
};

export default function GuestsLandingPage() {
  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Become a Podcast Guest | UvoCollab',
    description: 'Join UvoCollab as a podcast guest and connect with podcasters worldwide. Share your expertise, build your brand, and monetize your knowledge.',
    url: 'https://uvocollab.com/guests',
    mainEntity: {
      '@type': 'Service',
      name: 'Podcast Guest Services',
      provider: {
        '@type': 'Organization',
        name: 'UvoCollab',
        url: 'https://uvocollab.com',
      },
      serviceType: 'Podcast Guest Booking',
      areaServed: 'Worldwide',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Guest Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Podcast Guest Appearances',
              description: 'Connect with podcasters and share your expertise',
            },
          },
        ],
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center max-w-5xl mx-auto animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 mb-8">
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-purple-200 font-semibold">For Experts & Thought Leaders</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Share Your Expertise on <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 animate-gradientShift">
                Podcasts Worldwide
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with podcasters seeking your unique insights. Build your brand, reach new audiences, and get paid for your appearances.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/auth/signup"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Sign Up as a Guest
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <Link
                href="/marketplace/podcasts"
                className="px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white text-lg font-bold rounded-full hover:bg-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Browse Opportunities
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free to Join
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verified Podcasts
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Secure Payments
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Why Become a Guest?
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Transform your expertise into opportunities with our comprehensive guest platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: 'Expand Your Reach',
                  description: 'Get discovered by podcasters looking for experts in your field. Reach thousands of new listeners.',
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Monetize Your Knowledge',
                  description: 'Set your rates and get paid for appearances. Choose between paid gigs, free exposure, or pay-to-play opportunities.',
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Build Authority',
                  description: 'Showcase your expertise with a verified guest profile. Display your previous appearances and testimonials.',
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: 'Easy Scheduling',
                  description: 'Built-in scheduling tools make it simple to coordinate recordings. Get automatic calendar invites and reminders.',
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                  title: 'Secure Payments',
                  description: 'Payment protection with escrow. Funds are held securely until after your appearance.',
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ),
                  title: 'Smart Matching',
                  description: 'Our algorithm matches you with podcasts seeking your expertise. Get notified of perfect opportunities.',
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="group relative p-8 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-white shadow-lg shadow-purple-500/30">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                    <p className="text-white/70 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Getting started as a podcast guest is simple and straightforward
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-24 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-30"></div>

              {[
                {
                  step: '01',
                  title: 'Create Your Profile',
                  description: 'Sign up and build your guest profile with your expertise, bio, rates, and previous appearances.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                },
                {
                  step: '02',
                  title: 'Get Discovered',
                  description: 'Browse podcast opportunities or get matched with shows looking for your expertise.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ),
                },
                {
                  step: '03',
                  title: 'Connect & Schedule',
                  description: 'Agree on terms, schedule your recording, and receive automatic calendar invites and reminders.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                },
                {
                  step: '04',
                  title: 'Appear & Get Paid',
                  description: 'Record your episode, receive payment after it airs, and grow your audience.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="relative z-10 animate-slideIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:border-white/30 hover:transform hover:-translate-y-2 transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30 text-white">
                      {step.icon}
                    </div>
                    <div className="text-center mb-4">
                      <span className="text-purple-300 font-bold text-sm">Step {step.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 text-center">{step.title}</h3>
                    <p className="text-white/60 text-center leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                What Guests Say
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Join successful guests who have grown their brands through podcast appearances
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  quote: "UvoCollab made it incredibly easy to connect with relevant podcasts. I've been on 12 shows in 3 months and grown my audience significantly.",
                  author: "Sarah Mitchell",
                  title: "Marketing Expert",
                  rating: 5,
                },
                {
                  quote: "The platform handles everything - from scheduling to payments. I can focus on preparing great content instead of logistics.",
                  author: "David Chen",
                  title: "Tech Entrepreneur",
                  rating: 5,
                },
                {
                  quote: "Love the matching system! I only get contacted by podcasts that are truly relevant to my expertise. No more wasting time.",
                  author: "Emily Rodriguez",
                  title: "Wellness Coach",
                  rating: 5,
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="relative p-8 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  
                  {/* Quote Icon */}
                  <svg className="w-10 h-10 text-purple-400/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>

                  <p className="text-white/80 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>

                  {/* Rating Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-white font-semibold">{testimonial.author}</p>
                    <p className="text-white/60 text-sm">{testimonial.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Platform Features
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Everything you need to manage your podcast guest career
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                { icon: '✓', text: 'Create a professional guest profile' },
                { icon: '✓', text: 'Get matched with relevant podcasts' },
                { icon: '✓', text: 'Browse and apply to opportunities' },
                { icon: '✓', text: 'Set your appearance rates' },
                { icon: '✓', text: 'Built-in scheduling & calendar sync' },
                { icon: '✓', text: 'Secure payment processing' },
                { icon: '✓', text: 'Track your appearances & episodes' },
                { icon: '✓', text: 'Build your guest portfolio' },
                { icon: '✓', text: 'Get reviews & ratings' },
                { icon: '✓', text: 'Automatic reminders & notifications' },
                { icon: '✓', text: 'Request verification badge' },
                { icon: '✓', text: 'Wishlist your dream podcasts' },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {feature.icon}
                  </div>
                  <span className="text-white/90 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Ready to Share Your Story?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join UvoCollab today and start connecting with podcasters who want to hear what you have to say.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link
                  href="/auth/signup"
                  className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Create Your Guest Profile
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>

                <Link
                  href="/auth/login"
                  className="px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white text-lg font-bold rounded-full hover:bg-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Sign In
                </Link>
              </div>

              <p className="text-white/60">
                Already have an account?{' '}
                <Link href="/guest/profile" className="text-purple-400 hover:text-purple-300 font-semibold underline">
                  Update your profile
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              {[
                {
                  q: 'Is it free to join as a guest?',
                  a: 'Yes! Creating a guest profile on UvoCollab is completely free. We only take a small percentage when you get paid for an appearance.',
                },
                {
                  q: 'How do I set my rates?',
                  a: 'You can set your own rates in your profile. You can charge per appearance, offer free interviews, or even pay to appear on strategic podcasts. Rates are flexible and can be negotiated.',
                },
                {
                  q: 'What if I\'m new and have no previous appearances?',
                  a: 'That\'s perfectly fine! Many guests start their journey on UvoCollab. Focus on building a strong profile with your expertise and bio. Consider offering free appearances initially to build your portfolio.',
                },
                {
                  q: 'How does the verification badge work?',
                  a: 'You can request verification from your profile. Our team reviews your credentials, social presence, and previous appearances. Verified guests get priority in matching and discovery.',
                },
                {
                  q: 'When do I get paid?',
                  a: 'For paid appearances, payment is held in escrow and released after the episode is published. This protects both guests and podcasters.',
                },
                {
                  q: 'Can I choose which podcasts to appear on?',
                  a: 'Absolutely! You have full control. You can browse opportunities, apply to specific shows, or wait to be contacted by interested podcasters. You approve every booking.',
                },
              ].map((faq, index) => (
                <details
                  key={index}
                  className="group p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <summary className="flex items-center justify-between cursor-pointer text-white font-semibold text-lg">
                    {faq.q}
                    <svg className="w-5 h-5 text-purple-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 text-white/70 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}
