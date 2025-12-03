'use client';

import { useEffect, useState } from 'react';
import { User } from '@/app/types/user';

interface GuestOnboardingModalProps {
  user: User;
  onComplete: () => void;
}

export default function GuestOnboardingModal({ user, onComplete }: GuestOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem(`guest-onboarding-${user.uid}`);
    if (!hasSeenOnboarding && user.isGuest) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => setShowModal(true), 0);
    }
  }, [user.uid, user.isGuest]);

  const steps = [
    {
      title: '🎉 Welcome to UvoCollab!',
      content: (
        <div className="text-center">
          <p className="text-lg mb-4">
            Hi {user.displayName.split(' ')[0]}! You&apos;re now registered as a guest on UvoCollab.
          </p>
          <p className="text-gray-600">
            Let&apos;s take a quick tour to help you get started and make the most of the platform.
          </p>
        </div>
      ),
    },
    {
      title: '🔍 Browse Podcasts',
      content: (
        <div>
          <p className="mb-4">
            Discover podcasts looking for guests like you. Use filters to find shows that match your expertise and interests.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Search by topics relevant to your expertise to find the best matches!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '⭐ Create Your Wishlist',
      content: (
        <div>
          <p className="mb-4">
            Found podcasts you&apos;d love to appear on? Add them to your wishlist and let them know you&apos;re interested.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>💡 Tip:</strong> Include a personalized message with each wishlist entry to increase your chances!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '🤝 Get Matched',
      content: (
        <div>
          <p className="mb-4">
            When a podcast you&apos;re interested in is also interested in you, you&apos;ll get matched! You&apos;ll receive notifications when this happens.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <strong>💡 Tip:</strong> Keep your profile updated with your latest topics and availability!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: '✅ Complete Your Profile',
      content: (
        <div>
          <p className="mb-4">
            A complete, professional profile helps podcasts discover you and increases your match rate.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {user.guestBio ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-gray-400">○</span>
              )}
              <span>Add a compelling bio</span>
            </div>
            <div className="flex items-center gap-2">
              {user.guestTopics && user.guestTopics.length > 0 ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-gray-400">○</span>
              )}
              <span>List your expertise topics</span>
            </div>
            <div className="flex items-center gap-2">
              {user.previousAppearances && user.previousAppearances.length > 0 ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-gray-400">○</span>
              )}
              <span>Add previous appearances</span>
            </div>
            <div className="flex items-center gap-2">
              {user.socialLinks && user.socialLinks.length > 0 ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-gray-400">○</span>
              )}
              <span>Connect social media</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleClose = () => {
    localStorage.setItem(`guest-onboarding-${user.uid}`, 'true');
    setShowModal(false);
    onComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {steps[currentStep].title}
            </h2>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Skip
            </button>
          </div>
          {/* Progress Indicator */}
          <div className="flex gap-1 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t flex justify-between items-center gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>

          <span className="text-xs sm:text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>

          <button
            onClick={handleNext}
            className="px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
