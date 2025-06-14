"use client";
import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function ModelSelector({ value, onChange, modelPricing }) {
  const [selectedCategory, setSelectedCategory] = useState('fast');

  const modelCategories = {
    fast: {
      label: '🚀 Fast & Affordable',
      models: ['fal-ai/flux/dev', 'fal-ai/flux-realism']
    },
    premium: {
      label: '✨ Premium Quality', 
      models: ['fal-ai/flux-pro/v1.1', 'fal-ai/flux-pro/kontext', 'fal-ai/flux-pro']
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-900 mb-3">
        AI Model
      </label>
      
      {/* Category tabs */}
      <div className="flex border-b border-gray-200">
        {Object.entries(modelCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              selectedCategory === key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Model cards */}
      <div className="space-y-3">
        {modelCategories[selectedCategory].models.map((modelId) => {
          const model = modelPricing[modelId];
          if (!model) return null;

          return (
            <div
              key={modelId}
              onClick={() => onChange(modelId)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                value === modelId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{model.name}</h4>
                <StatusBadge status={selectedCategory === 'fast' ? 'success' : 'info'}>
                  ${model.price}/MP
                </StatusBadge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{model.description}</p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {selectedCategory === 'fast' && (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Fast</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Affordable</span>
                  </>
                )}
                {selectedCategory === 'premium' && (
                  <>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Premium</span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">High Quality</span>
                  </>
                )}
                {modelId.includes('kontext') && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Image Editing</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}