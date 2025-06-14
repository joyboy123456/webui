"use client";
import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function ModelSelector({ value, onChange, modelPricing }) {
  const [selectedCategory, setSelectedCategory] = useState('top');

  const modelCategories = {
    top: {
      label: '🏆 Top 10 热门',
      description: '全球最热门的顶级模型',
      models: [
        'fal-ai/flux-pro/kontext',
        'fal-ai/flux-pro/v1.1-ultra', 
        'fal-ai/google-imagen-4',
        'fal-ai/recraft-v3',
        'fal-ai/flux/dev'
      ]
    },
    popular: {
      label: '🔥 经典热门',
      description: '久经考验的经典选择',
      models: ['fal-ai/flux/schnell', 'fal-ai/flux/dev', 'fal-ai/flux-realism']
    },
    premium: {
      label: '👑 Premium',
      description: '商业级最高质量',
      models: ['fal-ai/flux-pro/v1.1-ultra', 'fal-ai/flux-pro']
    },
    specialized: {
      label: '🎭 专业特化',
      description: '特定任务专家',
      models: ['fal-ai/flux-pro/kontext', 'fal-ai/omnigen-v1', 'fal-ai/ideogram-v3']
    },
    budget: {
      label: '💰 性价比',
      description: '高性价比选择',
      models: ['fal-ai/flux/schnell', 'fal-ai/minimax-image-01', 'fal-ai/stable-diffusion-3.5-large']
    },
    artistic: {
      label: '🎨 艺术创作',
      description: '创意和自定义',
      models: ['fal-ai/flux-lora']
    }
  };

  const getSpeedBadge = (speed) => {
    if (speed.includes('Ultra') || speed.includes('1-4') || speed.includes('2-4')) return 'success';
    if (speed.includes('Fast')) return 'info';
    return 'warning';
  };

  const getCostBadge = (price) => {
    if (price <= 0.01) return 'success';
    if (price <= 0.03) return 'info';
    return 'warning';
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) return 'success';
    if (rank <= 6) return 'info';
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
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                      {model.name}
                    </h4>
                    {model.rank && (
                      <StatusBadge status={getRankBadge(model.rank)}>
                        #{model.rank}
                      </StatusBadge>
                    )}
                  </div>
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
                
                {model.hotness && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    {model.hotness}
                  </span>
                )}
                
                {selectedCategory === 'top' && model.rank <= 3 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    🥇 Top 3
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

                {modelId.includes('google') && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    🔍 Google
                  </span>
                )}

                {modelId.includes('recraft') && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    🏆 #1
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
          {selectedCategory === 'top' && (
            <p>🏆 这些是全球最热门的顶级模型，代表了当前AI图像生成的最高水平！</p>
          )}
          {selectedCategory === 'popular' && (
            <p>🔥 FLUX Schnell适合快速迭代，FLUX Dev提供最佳的质量-速度平衡。</p>
          )}
          {selectedCategory === 'premium' && (
            <p>👑 专业版模型提供商业级质量，具有先进功能和更快处理速度。</p>
          )}
          {selectedCategory === 'specialized' && (
            <p>🎭 这些模型在特定任务上表现卓越，如图像编辑和风格转换。</p>
          )}
          {selectedCategory === 'budget' && (
            <p>💰 高性价比选择，在保证质量的同时控制成本。</p>
          )}
          {selectedCategory === 'artistic' && (
            <p>🎨 使用LoRA模型自定义风格，创造无限艺术可能。</p>
          )}
        </div>
      </div>
    </div>
  );
}