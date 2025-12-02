'use client';

import { Collaboration } from '@/app/types/collaboration';
import { User } from '@/app/types/user';
import { useState } from 'react';

interface RecordingLinkManagerProps {
  collaboration: Collaboration;
  currentUser: User;
  isPodcastOwner: boolean;
  onLinkUpdated: () => void;
}

export default function RecordingLinkManager({
  collaboration,
  currentUser,
  isPodcastOwner,
  onLinkUpdated,
}: RecordingLinkManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(collaboration.recordingUrl || '');
  const [recordingPlatform, setRecordingPlatform] = useState<string>(collaboration.recordingPlatform || 'other');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platforms = [
    { value: 'zoom', label: 'Zoom', placeholder: 'https://zoom.us/j/...' },
    { value: 'riverside', label: 'Riverside.fm', placeholder: 'https://riverside.fm/studio/...' },
    { value: 'streamyard', label: 'StreamYard', placeholder: 'https://streamyard.com/...' },
    { value: 'zencastr', label: 'Zencastr', placeholder: 'https://zencastr.com/...' },
    { value: 'other', label: 'Other', placeholder: 'https://...' },
  ];

  const handleSave = async () => {
    if (!recordingUrl.trim()) {
      setError('Please enter a recording link');
      return;
    }

    // Validate URL format
    try {
      new URL(recordingUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/collaboration/recording-link', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId: collaboration.id,
          userId: currentUser.uid,
          recordingUrl: recordingUrl.trim(),
          recordingPlatform,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update recording link');
      }

      setIsEditing(false);
      onLinkUpdated();
      alert('Recording link updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recording link');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'zoom':
        return '📹';
      case 'riverside':
        return '🎙️';
      case 'streamyard':
        return '📺';
      case 'zencastr':
        return '🎧';
      default:
        return '🔗';
    }
  };

  const getPlatformName = (platform?: string) => {
    const p = platforms.find(p => p.value === platform);
    return p ? p.label : 'Other Platform';
  };

  // Only show if collaboration has a confirmed schedule or is scheduled
  const shouldShow = collaboration.status === 'scheduled' || collaboration.schedulingDetails;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🎙️ Recording Link</h2>

      {!isPodcastOwner && !collaboration.recordingUrl && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            The podcast owner will share the recording link soon.
          </p>
        </div>
      )}

      {collaboration.recordingUrl && !isEditing && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getPlatformIcon(collaboration.recordingPlatform)}</span>
              <div>
                <p className="font-semibold text-gray-900">{getPlatformName(collaboration.recordingPlatform)}</p>
                <p className="text-sm text-gray-600">Recording platform</p>
              </div>
            </div>
            {isPodcastOwner && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>

          <div className="bg-gray-50 rounded p-3 mb-3">
            <p className="text-sm text-gray-600 mb-1">Link:</p>
            <a
              href={collaboration.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 break-all"
            >
              {collaboration.recordingUrl}
            </a>
          </div>

          <a
            href={collaboration.recordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 font-medium"
          >
            🚀 Join Recording
          </a>
        </div>
      )}

      {isPodcastOwner && (!collaboration.recordingUrl || isEditing) && (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recording Platform
            </label>
            <select
              value={recordingPlatform}
              onChange={(e) => {
                setRecordingPlatform(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              {platforms.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recording Link <span className="text-red-600">*</span>
            </label>
            <input
              type="url"
              value={recordingUrl}
              onChange={(e) => {
                setRecordingUrl(e.target.value);
                setError(null);
              }}
              placeholder={platforms.find(p => p.value === recordingPlatform)?.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              Enter the meeting/studio link where the recording will take place
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {submitting ? 'Saving...' : collaboration.recordingUrl ? 'Update Link' : 'Save Link'}
            </button>
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setRecordingUrl(collaboration.recordingUrl || '');
                  setRecordingPlatform(collaboration.recordingPlatform || 'other');
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            )}
          </div>

          {!collaboration.recordingUrl && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> The guest will receive an email notification with the recording link once you save it.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
