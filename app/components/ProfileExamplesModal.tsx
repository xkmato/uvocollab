'use client';

import { useState } from 'react';

export default function ProfileExamplesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);

  const examples = [
    {
      name: 'Sarah Johnson',
      role: 'Marketing Strategist',
      bio: 'Marketing consultant with 10+ years helping SaaS companies scale. Former CMO at two successful startups. Passionate about content marketing, SEO, and customer acquisition strategies.',
      topics: ['Digital Marketing', 'SaaS Growth', 'Content Strategy', 'SEO', 'Customer Acquisition'],
      rate: 500,
      availability: 'Available weekdays 2-5 PM EST',
      tip: 'Notice how Sarah clearly states her expertise and experience in a concise way, making it easy for podcasters to understand her value.',
    },
    {
      name: 'Michael Chen',
      role: 'Tech Entrepreneur',
      bio: 'Serial entrepreneur and angel investor. Founded 3 tech startups (2 exits). Now helping early-stage founders navigate fundraising, product-market fit, and scaling challenges. MIT grad, Y Combinator alum.',
      topics: ['Entrepreneurship', 'Startup Funding', 'Product Development', 'Angel Investing', 'Tech Innovation'],
      rate: 0,
      availability: 'Flexible, prefer evenings PST',
      tip: 'Michael includes specific achievements and credentials, which builds credibility. He also offers free appearances to support the community.',
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Clinical Psychologist',
      bio: 'Licensed psychologist specializing in workplace mental health and burnout prevention. Author of "Mindful Leadership". Regular contributor to Psychology Today. Passionate about making mental health resources accessible.',
      topics: ['Mental Health', 'Workplace Wellness', 'Leadership', 'Burnout Prevention', 'Mindfulness'],
      rate: 750,
      availability: 'Tuesdays and Thursdays',
      tip: 'Dr. Rodriguez leverages her credentials and published work to establish authority. Her specific availability makes scheduling easier.',
    },
  ];

  const currentEx = examples[currentExample];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        View profile examples
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  📋 Profile Examples
                </h2>
                <p className="text-sm text-gray-600">
                  Learn from great guest profiles
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close profile examples"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Example Navigation */}
            <div className="p-4 sm:p-6 border-b">
              <div className="flex gap-2 overflow-x-auto">
                {examples.map((ex, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentExample(index)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      currentExample === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ex.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Example Content */}
            <div className="p-4 sm:p-6">
              {/* Profile Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 mb-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {currentEx.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {currentEx.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">{currentEx.role}</p>
                    <p className="text-sm sm:text-base text-blue-600 font-medium mt-1">
                      {currentEx.rate === 0 ? 'Free / Negotiable' : `$${currentEx.rate}`}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Bio</h4>
                  <p className="text-sm sm:text-base text-gray-700">{currentEx.bio}</p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentEx.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Availability</h4>
                  <p className="text-sm text-gray-600">📅 {currentEx.availability}</p>
                </div>
              </div>

              {/* Why This Works */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm sm:text-base font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>Why this profile works</span>
                </h4>
                <p className="text-sm text-green-800">{currentEx.tip}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/guest/profile';
                  }}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update My Profile
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
