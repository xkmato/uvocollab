'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Collaboration } from '@/app/types/collaboration';
import { Service } from '@/app/types/service';
import { User } from '@/app/types/user';

interface PaymentCheckoutProps {
  collaboration: Collaboration;
  legend: User;
  service: Service;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    FlutterwaveCheckout: (config: {
      public_key: string;
      tx_ref: string;
      amount: number;
      currency: string;
      payment_options: string;
      customer: {
        email: string;
        name: string;
      };
      customizations: {
        title: string;
        description: string;
        logo?: string;
      };
      callback: (response: { status: string; transaction_id: string; tx_ref: string }) => void;
      onclose: () => void;
    }) => void;
  }
}

export default function PaymentCheckout({
  collaboration,
  legend,
  service,
  onSuccess,
}: PaymentCheckoutProps) {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Flutterwave inline script
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!user || !userData) {
      setError('Please log in to continue');
      return;
    }

    if (!scriptLoaded) {
      setError('Payment system is still loading. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get payment configuration from backend
      const token = await user.getIdToken();
      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collaborationId: collaboration.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Initialize Flutterwave payment modal
      window.FlutterwaveCheckout({
        public_key: data.publicKey,
        tx_ref: data.txRef,
        amount: collaboration.price,
        currency: 'USD',
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email: userData.email,
          name: userData.displayName,
        },
        customizations: {
          title: 'UvoCollab',
          description: `Payment for: ${service.title} by ${legend.displayName}`,
          logo: 'https://uvocollab.com/logo.png', // Update with actual logo URL
        },
        callback: async (response) => {
          if (response.status === 'successful') {
            // Verify payment on backend
            await verifyPayment(response.transaction_id, response.tx_ref);
          } else {
            setError('Payment was not successful. Please try again.');
            setLoading(false);
          }
        },
        onclose: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  const verifyPayment = async (transactionId: string, txRef: string) => {
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId,
          txRef,
          collaborationId: collaboration.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      // Payment successful
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const platformFee = collaboration.price * 0.2;
  const legendPayout = collaboration.price - platformFee;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
        <p className="text-gray-600">
          Your collaboration request has been accepted! Complete the payment to proceed.
        </p>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Service:</span>
            <span className="font-medium">{service.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Artist:</span>
            <span className="font-medium">{legend.displayName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Deliverable:</span>
            <span className="font-medium">{service.deliverable}</span>
          </div>
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-gray-900">Total Amount:</span>
              <span className="font-bold text-blue-600">${collaboration.price.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Payment Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-800">Artist Payout:</span>
            <span className="font-medium text-blue-900">${legendPayout.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-800">Platform Fee (20%):</span>
            <span className="font-medium text-blue-900">${platformFee.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Escrow Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-green-900 text-sm">Secure Escrow Payment</h4>
            <p className="text-sm text-green-800 mt-1">
              Your payment is held securely in escrow. The artist will only receive payment
              after you confirm the deliverables meet your expectations.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || !scriptLoaded}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processing...' : !scriptLoaded ? 'Loading...' : `Pay $${collaboration.price.toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        By completing this payment, you agree to our Terms of Service and acknowledge
        that funds will be held in escrow until project completion.
      </p>
    </div>
  );
}
