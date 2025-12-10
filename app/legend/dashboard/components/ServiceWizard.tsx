'use client';

import { Service } from '@/app/types/service';
import { useState } from 'react';

interface ServiceWizardProps {
    initialData?: Service | null;
    onSave: (data: Partial<Service>) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
}

export default function ServiceWizard({ initialData, onSave, onCancel, isSaving }: ServiceWizardProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        price: initialData?.price?.toString() || '',
        deliverable: initialData?.deliverable || '',
        serviceType: initialData?.serviceType || '',
        isActive: initialData?.isActive ?? true,
    });
    const [error, setError] = useState('');

    const totalSteps = 3;

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.title || !formData.description) {
                setError('Please fill in all required fields');
                return;
            }
        }
        if (step === 2) {
            if (!formData.deliverable) {
                setError('Please specify the deliverable');
                return;
            }
        }
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(formData.price);
        if (isNaN(priceNum) || priceNum <= 0) {
            setError('Price must be greater than 0 UGX');
            return;
        }

        onSave({
            ...formData,
            price: priceNum,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slideIn">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Edit Service' : 'Create New Service'}
                        </h2>
                        <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>
                    </div>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 h-1">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 transition-all duration-300 ease-in-out"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    ></div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="min-h-[300px]">
                        {step === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="e.g., 16-bar verse, Full song production"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Describe what's included in this service..."
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                                    <select
                                        value={formData.serviceType}
                                        onChange={(e) => handleChange('serviceType', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">Select a service type</option>
                                        <option value="Verse">Verse</option>
                                        <option value="Feature">Feature</option>
                                        <option value="Hook/Chorus">Hook/Chorus</option>
                                        <option value="Full Song">Full Song</option>
                                        <option value="Production">Production</option>
                                        <option value="Mixing">Mixing</option>
                                        <option value="Mastering">Mastering</option>
                                        <option value="Songwriting">Songwriting</option>
                                        <option value="Recording">Recording</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deliverable *</label>
                                    <input
                                        type="text"
                                        value={formData.deliverable}
                                        onChange={(e) => handleChange('deliverable', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="e.g., 1 WAV file, Stems + Mixed Master"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fadeIn">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Availability</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (UGX) *</label>
                                    <div className="relative rounded-lg shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">UGX</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => handleChange('price', e.target.value)}
                                            min="0.01"
                                            step="0.01"
                                            className="block w-full pl-7 pr-12 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => handleChange('isActive', e.target.checked)}
                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all"
                                    />
                                    <label htmlFor="isActive" className="ml-3 block text-sm font-medium text-gray-900">
                                        Active (visible to buyers)
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-100 flex items-center animate-fadeIn">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={step === 1}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${step === 1
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
                                {isSaving ? 'Saving...' : initialData ? 'Update Service' : 'Create Service'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
