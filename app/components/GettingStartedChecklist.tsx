'use client';

import { User } from '@/app/types/user';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface GettingStartedChecklistProps {
  user: User;
}

export default function GettingStartedChecklist({ user }: GettingStartedChecklistProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);

  const checklist = [
    {
      id: 'profile',
      label: 'Complete your profile',
      completed: !!(user.guestBio && user.guestTopics && user.guestTopics.length > 0),
      action: () => router.push('/guest/profile'),
      description: 'Add your bio, expertise topics, and rate',
    },
    {
      id: 'photo',
      label: 'Upload a profile photo',
      completed: !!user.profileImageUrl,
      action: () => router.push('/guest/profile'),
      description: 'A professional photo helps build trust',
    },
    {
      id: 'social',
      label: 'Connect social media',
      completed: !!(user.socialLinks && user.socialLinks.length > 0),
      action: () => router.push('/guest/profile'),
      description: 'Link your social profiles to showcase your presence',
    },
    {
      id: 'appearances',
      label: 'Add previous appearances',
      completed: !!(user.previousAppearances && user.previousAppearances.length > 0),
      action: () => router.push('/guest/profile'),
      description: 'Show your experience as a guest',
    },
    {
      id: 'wishlist',
      label: 'Create your first wishlist',
      completed: false, // This would need to be checked from Firestore
      action: () => router.push('/marketplace/podcasts'),
      description: 'Find and add podcasts you would like to appear on',
    },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  // Don't show if everything is completed
  if (completedCount === checklist.length) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
            🚀 Getting Started
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            Complete these steps to maximize your chances of getting booked
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 ml-2"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            {completedCount} of {checklist.length} completed
          </span>
          <span className="text-xs sm:text-sm font-bold text-blue-600">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 absolute top-0 left-0"
            {...{ style: { width: `${progress}%` } }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      {isExpanded && (
        <div className="space-y-2 sm:space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                item.completed
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-white border border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.completed ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-300 rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-sm sm:text-base font-medium ${
                      item.completed ? 'text-green-900 line-through' : 'text-gray-900'
                    }`}
                  >
                    {item.label}
                  </h4>
                  {!item.completed && (
                    <button
                      onClick={item.action}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                    >
                      Start →
                    </button>
                  )}
                </div>
                {!item.completed && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Motivational message */}
      {isExpanded && completedCount > 0 && completedCount < checklist.length && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>Great progress!</strong> Complete the remaining tasks to boost your profile visibility.
          </p>
        </div>
      )}
    </div>
  );
}
