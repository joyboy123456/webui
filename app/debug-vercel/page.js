"use client";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faCheckCircle, faExclamationTriangle, faTimesCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

export default function DebugVercelPage() {
  const [debugResult, setDebugResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-vercel');
      const data = await response.json();
      setDebugResult(data);
    } catch (error) {
      console.error('调试失败:', error);
      setDebugResult({
        error: error.message,
        debug: null,
        recommendations: [{
          type: 'error',
          title: '调试API调用失败',
          description: error.message,
          action: '检查网络连接和API端点'
        }]
      });
    }
    setLoading(false);
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success': return faCheckCircle;
      case 'warning': return faExclamationTriangle;
      case 'error': return faTimesCircle;
      default: return faInfoCircle;
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">🔍 Vercel环境调试工具</h1>
          <p className="text-gray-600 mb-6">
            这个工具会检查你的Vercel部署环境，包括环境变量、API连接和文件系统权限。
          </p>
          
          <button
            onClick={runDebug}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
          >
            <FontAwesomeIcon icon={faPlay} className="mr-2" />
            {loading ? '正在检查...' : '开始调试'}
          </button>
        </div>

        {debugResult && (
          <div className="space-y-6">
            {/* 推荐解决方案 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 诊断结果</h2>
              <div className="space-y-4">
                {debugResult.recommendations?.map((rec, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getStatusColor(rec.type)}`}>
                    <div className="flex items-start">
                      <FontAwesomeIcon 
                        icon={getStatusIcon(rec.type)} 
                        className="mr-3 mt-1 flex-shrink-0" 
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{rec.title}</h3>
                        <p className="text-sm mb-2">{rec.description}</p>
                        <p className="text-xs font-medium">💡 解决方案: {rec.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 详细调试信息 */}
            {debugResult.debug && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 详细信息</h2>
                
                {/* 环境信息 */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">环境配置</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Vercel环境:</span> 
                      <span className={debugResult.debug.environment.isVercel ? 'text-green-600' : 'text-red-600'}>
                        {debugResult.debug.environment.isVercel ? '✅ 是' : '❌ 否'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Node环境:</span> 
                      <span className="text-gray-600">{debugResult.debug.environment.nodeEnv}</span>
                    </div>
                    <div>
                      <span className="font-medium">Vercel区域:</span> 
                      <span className="text-gray-600">{debugResult.debug.environment.vercelRegion || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">部署URL:</span> 
                      <span className="text-gray-600">{debugResult.debug.environment.vercelUrl || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* 环境变量 */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">环境变量</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>FAL_KEY:</span>
                      <span className={debugResult.debug.environmentVariables.falKey.exists ? 'text-green-600' : 'text-red-600'}>
                        {debugResult.debug.environmentVariables.falKey.exists ? 
                          `✅ 已设置 (${debugResult.debug.environmentVariables.falKey.length}字符)` : 
                          '❌ 未设置'
                        }
                      </span>
                    </div>
                    {debugResult.debug.environmentVariables.falKey.preview && (
                      <div className="text-xs text-gray-500 ml-4">
                        预览: {debugResult.debug.environmentVariables.falKey.preview}
                      </div>
                    )}
                  </div>
                </div>

                {/* API测试结果 */}
                {debugResult.debug.falApiTest && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">FAL API测试</h3>
                    <div className="text-sm">
                      <div className="flex justify-between mb-2">
                        <span>连接状态:</span>
                        <span className={debugResult.debug.falApiTest.success ? 'text-green-600' : 'text-red-600'}>
                          {debugResult.debug.falApiTest.success ? '✅ 成功' : '❌ 失败'}
                        </span>
                      </div>
                      {debugResult.debug.falApiTest.error && (
                        <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded">
                          错误: {debugResult.debug.falApiTest.error}
                        </div>
                      )}
                      {debugResult.debug.falApiTest.success && (
                        <div className="text-green-600 text-xs mt-2 p-2 bg-green-50 rounded">
                          ✅ API连接正常，生成了 {debugResult.debug.falApiTest.imageCount} 张测试图片
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 原始调试数据 */}
                <details className="mt-6">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    查看原始调试数据
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(debugResult.debug, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}