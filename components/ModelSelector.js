"use client";
import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function ModelSelector({ value, onChange, modelPricing }) {
  const [selectedCategory, setSelectedCategory] = useState('popular');

  const modelCategories = {
    popular: {
      label: '🔥 Most Popular',
      description: 'Top choices for most users',
      models: ['fal-ai/flux/schnell', 'fal-ai/flux/dev', 'fal-ai/flux-realism']
    },
    premium: {
      label: '👑 Premium Quality',
      description: 'Highest quality, commercial grade',
      models: ['fal-ai/flux-pro/v1.1', 'fal-ai/flux-pro']
    },
    specialized: {
      label: '🎭 Specialized',
      description: 'Task-specific models',
      models: ['fal-ai/flux-pro/kontext', 'fal-ai/flux/dev/image-to-image']
    },
    artistic: {
      label: '🎨 Artistic',
      description: 'Creative and customizable',
      models: ['fal-ai/flux-lora', 'fal-ai/aura-flow']
    },
    fast: {
      label: '⚡ Ultra Fast',
      description: 'Speed optimized',
      models: ['fal-ai/lightning', 'fal-ai/turbo']
    }
  };

  const getSpeedBadge = (speed) => {
    if (speed.includes('1-4') || speed.includes('2-4')) return 'success';
    if (speed.includes('Ultra') || speed.includes('Fast')) return 'info';
    return 'warning';
  };

  const getCostBadge = (price) => {
    if (price <= 0.01) return 'success';
    if (price <= 0.03) return 'info';
    return 'warning';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">
          🤖 AI Model Selection
        </label>
        <StatusBadge status="info">
          {Object.keys(modelPricing).length} models
        </StatusBadge>
      </div>
      
      {/* Category tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
        {Object.entries(modelCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`py-2 px-3 text-xs font-medium rounded-md transition-all ${
              selectedCategory === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Category description */}
      <div className="text-xs text-gray-500 text-center py-2 bg-gray-50 rounded-lg">
        {modelCategories[selectedCategory].description}
      </div>

      {/* Model cards */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {modelCategories[selectedCategory].models.map((modelId) => {
          const model = modelPricing[modelId];
          if (!model) return null;

          return (
            <div
              key={modelId}
              onClick={() => onChange(modelId)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                value === modelId
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                    {model.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {model.description}
                  </p>
                </div>
                <div className="ml-2 flex flex-col items-end space-y-1">
                  <StatusBadge status={getCostBadge(model.price)}>
                    ${model.price}
                  </StatusBadge>
                </div>
              </div>
              
              {/* Model specs */}
              <div className="flex flex-wrap gap-1 mt-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  getSpeedBadge(model.speed) === 'success' 
                    ? 'bg-green-100 text-green-700' 
                    : getSpeedBadge(model.speed) === 'info'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {model.speed}
                </span>
                
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  {model.quality}
                </span>
                
                {selectedCategory === 'popular' && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    🔥 Hot
                  </span>
                )}
                
                {selectedCategory === 'premium' && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    👑 Pro
                  </span>
                )}
                
                {modelId.includes('kontext') && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    ✏️ Edit
                  </span>
                )}
                
                {modelId.includes('lora') && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    🎭 Custom
                  </span>
                )}
              </div>

              {/* Selection indicator */}
              {value === modelId && (
                <div className="mt-3 flex items-center text-blue-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">Selected</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-800 space-y-1">
          <div className="flex justify-between">
            <span>💡 <strong>Tip:</strong></span>
            <span className="text-blue-600">Choose wisely!</span>
          </div>
          {selectedCategory === 'popular' && (
            <p>FLUX Schnell is perfect for quick iterations, while FLUX Dev offers the best quality-speed balance.</p>
          )}
          {selectedCategory === 'premium' && (
            <p>Pro models deliver commercial-grade quality with advanced features and faster processing.</p>
          )}
          {selectedCategory === 'specialized' && (
            <p>These models excel at specific tasks like image editing and style transfer.</p>
          )}
          {selectedCategory === 'artistic' && (
            <p>Customize your style with LoRA models or try AuraFlow for unique artistic results.</p>
          )}
          {selectedCategory === 'fast' && (
            <p>Lightning-fast generation for rapid prototyping and quick concepts.</p>
          )}
        </div>
      </div>
    </div>
  );
}