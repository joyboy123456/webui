"use client";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faCheckCircle, faExclamationTriangle, faTimesCircle, faRefresh } from '@fortawesome/free-solid-svg-icons';

export default function CheckKeyPage() {
  const [keyStatus, setKeyStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkKey = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-key');
      const data = await response.json();
      setKeyStatus(data);
    } catch (error) {
      console.error('Failed to check key:', error);
      setKeyStatus({
        error: error.message,
        status: 'error'
      });
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid': return faCheckCircle;
      case 'invalid': return faExclamationTriangle;
      case 'error': return faTimesCircle;
      default: return faKey;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-50 border-green-200';
      case 'invalid': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            <FontAwesomeIcon icon={faKey} className="mr-2 text-blue-500" />
            API Key Checker
          </h1>
          <p className="text-gray-600 mb-6">
            Check your FAL_KEY configuration and troubleshoot any issues.
          </p>
          
          <button
            onClick={checkKey}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
          >
            <FontAwesomeIcon icon={faRefresh} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Check API Key'}
          </button>
        </div>

        {keyStatus && (
          <div className="space-y-4">
            {/* Status Summary */}
            <div className={`p-4 rounded-lg border ${getStatusColor(keyStatus.status)}`}>
              <div className="flex items-center">
                <FontAwesomeIcon 
                  icon={getStatusIcon(keyStatus.status)} 
                  className="mr-3 text-xl" 
                />
                <div>
                  <h3 className="font-semibold text-lg">
                    {keyStatus.status === 'valid' ? 'API Key Valid ✅' : 
                     keyStatus.status === 'invalid' ? 'API Key Issues ⚠️' : 
                     'Error Checking Key ❌'}
                  </h3>
                  <p className="text-sm mt-1">
                    {keyStatus.status === 'valid' ? 'Your API key is properly configured' :
                     keyStatus.status === 'invalid' ? 'There are issues with your API key configuration' :
                     'Unable to check API key status'}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Details */}
            {!keyStatus.error && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Key Exists:</span>
                    <span className={`ml-2 ${keyStatus.keyExists ? 'text-green-600' : 'text-red-600'}`}>
                      {keyStatus.keyExists ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Key Length:</span>
                    <span className="ml-2 text-gray-600">{keyStatus.keyLength} characters</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Valid Format:</span>
                    <span className={`ml-2 ${keyStatus.validFormat ? 'text-green-600' : 'text-red-600'}`}>
                      {keyStatus.validFormat ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Environment:</span>
                    <span className="ml-2 text-gray-600">{keyStatus.environment}</span>
                  </div>
                  {keyStatus.keyPreview && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Key Preview:</span>
                      <span className="ml-2 text-gray-600 font-mono">{keyStatus.keyPreview}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
              <div className="space-y-3">
                {keyStatus.recommendations?.map((rec, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-800">{rec.issue}</div>
                    <div className="text-sm text-gray-600 mt-1">{rec.solution}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Setup Instructions</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>1. Get your FAL API Key:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Visit <a href="https://fal.ai/dashboard/keys" target="_blank" className="underline">https://fal.ai/dashboard/keys</a></li>
                  <li>Sign up or log in to your account</li>
                  <li>Generate a new API key</li>
                </ul>
                
                <p className="mt-3"><strong>2. Add to your .env.local file:</strong></p>
                <div className="bg-blue-100 p-3 rounded font-mono text-xs mt-2">
                  FAL_KEY=fal-your-actual-key-here
                </div>
                
                <p className="mt-3"><strong>3. Restart your development server:</strong></p>
                <div className="bg-blue-100 p-3 rounded font-mono text-xs mt-2">
                  npm run dev
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}