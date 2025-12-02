'use client';

import { useEffect, useState } from 'react';
import { CollaborationFeedback } from '@/app/types/feedback';

interface FeedbackDisplayProps {
  userId: string;
  showStats?: boolean;
  maxReviews?: number;
}

export default function FeedbackDisplay({
  userId,
  showStats = true,
  maxReviews = 5,
}: FeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<CollaborationFeedback[]>([]);
  const [stats, setStats] = useState<{
    averageRating: number;
    totalReviews: number;
    wouldCollaborateAgainPercentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [userId]);

  const loadFeedback = async () => {
    try {
      const response = await fetch(`/api/collaboration/feedback?toUserId=${userId}`);
      const data = await response.json();

      if (response.ok && data.feedback) {
        setFeedback(data.feedback);
        
        // Calculate stats
        if (data.feedback.length > 0) {
          const totalRating = data.feedback.reduce((sum: number, f: any) => sum + f.rating, 0);
          const wouldCollabAgain = data.feedback.filter((f: any) => f.wouldCollaborateAgain).length;
          
          setStats({
            averageRating: totalRating / data.feedback.length,
            totalReviews: data.feedback.length,
            wouldCollaborateAgainPercentage: (wouldCollabAgain / data.feedback.length) * 100,
          });
        }
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (feedback.length === 0) {
    return null; // Don't show section if no feedback
  }

  const displayedFeedback = showAll ? feedback : feedback.slice(0, maxReviews);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews & Ratings</h2>

      {/* Stats Summary */}
      {showStats && stats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400">
                      {star <= Math.round(stats.averageRating) ? '⭐' : '☆'}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {stats.wouldCollaborateAgainPercentage.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-600">
                would collaborate again
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedFeedback.map((item) => (
          <div key={item.id} className="border-b pb-4 last:border-b-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400 text-sm">
                    {star <= item.rating ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
              {item.wouldCollaborateAgain && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Would work together again
                </span>
              )}
            </div>
            
            {item.review && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.review}</p>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              {item.createdAt && new Date(item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {feedback.length > maxReviews && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {showAll ? 'Show Less' : `Show All ${feedback.length} Reviews`}
        </button>
      )}
    </div>
  );
}
