'use client';

import { useState, useEffect } from 'react';

interface CollaborationFeedbackFormProps {
  collaborationId: string;
  userId: string;
  recipientName: string;
  onSubmit: () => void;
}

export default function CollaborationFeedbackForm({
  collaborationId,
  userId,
  recipientName,
  onSubmit,
}: CollaborationFeedbackFormProps) {
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [wouldCollaborateAgain, setWouldCollaborateAgain] = useState<boolean | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    // Check if feedback already exists
    checkExistingFeedback();
  }, [collaborationId, userId]);

  const checkExistingFeedback = async () => {
    try {
      const response = await fetch(
        `/api/collaboration/feedback?collaborationId=${collaborationId}&userId=${userId}`
      );
      const data = await response.json();
      
      if (data.feedback && data.feedback.length > 0) {
        setAlreadySubmitted(true);
      }
    } catch (err) {
      console.error('Error checking feedback:', err);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (wouldCollaborateAgain === null) {
      setError('Please indicate if you would collaborate again');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/collaboration/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaborationId,
          userId,
          rating,
          review: review.trim() || undefined,
          wouldCollaborateAgain,
          isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setShowModal(false);
      setAlreadySubmitted(true);
      onSubmit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadySubmitted) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 font-medium">✓ Feedback submitted</p>
        <p className="text-sm text-green-600 mt-1">
          Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
      >
        Leave Feedback
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Leave Feedback</h2>

            <p className="text-gray-600 mb-6">
              Share your experience working with <strong>{recipientName}</strong>
            </p>

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-3xl transition-colors focus:outline-none"
                    disabled={submitting}
                  >
                    {star <= (hoveredRating || rating) ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Review */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Written Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share details about your experience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                disabled={submitting}
              />
            </div>

            {/* Would Collaborate Again */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Would you collaborate again? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="wouldCollaborateAgain"
                    checked={wouldCollaborateAgain === true}
                    onChange={() => setWouldCollaborateAgain(true)}
                    className="mr-2"
                    disabled={submitting}
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="wouldCollaborateAgain"
                    checked={wouldCollaborateAgain === false}
                    onChange={() => setWouldCollaborateAgain(false)}
                    className="mr-2"
                    disabled={submitting}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* Public/Private */}
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2"
                  disabled={submitting}
                />
                <span className="text-sm text-gray-700">
                  Make this review public (visible on {recipientName}'s profile)
                </span>
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
