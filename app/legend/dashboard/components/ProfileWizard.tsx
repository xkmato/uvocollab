'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { User } from '@/app/types/user';

interface ProfileWizardProps {
    initialData: Partial<User>;
    onSave: (data: Partial<User>) => Promise<void>;
    isSaving: boolean;
}

export default function ProfileWizard({ initialData, onSave, isSaving }: ProfileWizardProps) {
    const [step, setStep] = useState(1);
    type FormPriceRange = 'budget' | 'mid' | 'premium' | '' | undefined;
    interface FormData {
        displayName?: string;
        profileImageUrl?: string;
        bio?: string;
        managementInfo?: string;
        genre?: string;
        priceRange?: FormPriceRange;
    }

    const [formData, setFormData] = useState<FormData>({
        displayName: initialData.displayName || '',
        profileImageUrl: initialData.profileImageUrl || '',
        bio: initialData.bio || '',
        managementInfo: initialData.managementInfo || '',
        genre: initialData.genre || '',
        priceRange: (initialData.priceRange as FormPriceRange) ?? '',
    });

    const totalSteps = 3;

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Normalize priceRange: pass undefined if empty string to satisfy Partial<User> type
        const priceRangeValue = (formData.priceRange === '' ? undefined : (formData.priceRange as 'budget' | 'mid' | 'premium' | undefined));

        const dataToSave: Partial<User> = {
            displayName: formData.displayName,
            profileImageUrl: formData.profileImageUrl,
            bio: formData.bio,
            managementInfo: formData.managementInfo,
            genre: formData.genre,
            priceRange: priceRangeValue,
        };

        onSave(dataToSave);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Progress Bar */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">Step {step} of {totalSteps}</span>
                    <span className="text-sm font-medium text-blue-600">{Math.round((step / totalSteps) * 100)}% Completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    ></div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
                <div className="min-h-[300px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => handleChange('displayName', e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Your stage name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL</label>
                                <input
                                    type="url"
                                    value={formData.profileImageUrl}
                                    onChange={(e) => handleChange('profileImageUrl', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="https://example.com/your-image.jpg"
                                />
                                {formData.profileImageUrl && (
                                    <div className="mt-4 flex justify-center">
                                        <img 
                                            src={formData.profileImageUrl} 
                                            alt="Profile Preview" 
                                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Story & Contact</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => handleChange('bio', e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Tell your story. What makes you unique?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Management Info</label>
                                <textarea
                                    value={formData.managementInfo}
                                    onChange={(e) => handleChange('managementInfo', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Booking info or professional details"
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Genre</label>
                                    <select
                                        value={formData.genre}
                                        onChange={(e) => handleChange('genre', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select a genre</option>
                                        <option value="Hip Hop">Hip Hop</option>
                                        <option value="R&B">R&B</option>
                                        <option value="Pop">Pop</option>
                                        <option value="Rock">Rock</option>
                                        <option value="Electronic">Electronic</option>
                                        <option value="Jazz">Jazz</option>
                                        <option value="Country">Country</option>
                                        <option value="Latin">Latin</option>
                                        <option value="Gospel">Gospel</option>
                                        <option value="Alternative">Alternative</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                                    <select
                                        value={formData.priceRange}
                                        onChange={(e) => handleChange('priceRange', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select a price range</option>
                                        <option value="budget">Budget ($0 - $500)</option>
                                        <option value="mid">Mid-Range ($500 - $2000)</option>
                                        <option value="premium">Premium ($2000+)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={step === 1}
                        className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                            step === 1 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        Back
                    </button>
                    
                    {step < totalSteps ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="px-8 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
