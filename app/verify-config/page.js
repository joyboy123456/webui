"use client";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faTimesCircle, faRocket, faKey, faLock } from '@fortawesome/free-solid-svg-icons';

export default function VerifyConfigPage() {
  const [configStatus, setConfigStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/verify-config');
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      console.error('Failed to verify config:', error);
      setConfigStatus({
        error: error.message,
        status: 'error'
      });
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return faCheckCircle;
      case 'warning': return faExclamationTriangle;
      case 'error': return faTimesCircle;
      default: return faRocket;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            <FontAwesomeIcon icon={faRocket} className="mr-2 text-blue-500" />
            Vercel 配置验证
          </h1>
          <p className="text-gray-600 mb-6">
            检查你的 Vercel 环境变量配置是否正确生效。
          </p>
          
          <button
            onClick={verifyConfig}
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
          >
            <FontAwesomeIcon icon={faRocket} className={`mr-2 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? '验证中...' : '开始验证配置'}
          </button>
        </div>

        {configStatus && (
          <div className="space-y-6">
            {/* 总体状态 */}
            <div className={`p-6 rounded-lg border ${getStatusColor(configStatus.overallStatus)}`}>
              <div className="flex items-center">
                <FontAwesomeIcon 
                  icon={getStatusIcon(configStatus.overallStatus)} 
                  className="mr-3 text-2xl" 
                />
                <div>
                  <h3 className="font-bold text-xl">
                    {configStatus.overallStatus === 'success' ? '🎉 配置完美！' : 
                     configStatus.overallStatus === 'warning' ? '⚠️ 配置有问题' : 
                     '❌ 配置错误'}
                  </h3>
                  <p className="text-sm mt-1">
                    {configStatus.message}
                  </p>
                </div>
              </div>
            </div>

            {/* 环境信息 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 环境信息</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">运行环境:</span>
                  <span className="ml-2 text-gray-600">{configStatus.environment?.platform}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Node 环境:</span>
                  <span className="ml-2 text-gray-600">{configStatus.environment?.nodeEnv}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Vercel 区域:</span>
                  <span className="ml-2 text-gray-600">{configStatus.environment?.region || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">部署 URL:</span>
                  <span className="ml-2 text-gray-600 text-xs">{configStatus.environment?.url || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* API 密钥状态 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <FontAwesomeIcon icon={faKey} className="mr-2 text-blue-500" />
                FAL_KEY 状态
              </h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border ${getStatusColor(configStatus.falKey?.status)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {configStatus.falKey?.exists ? '✅ API 密钥已设置' : '❌ API 密钥未找到'}
                      </div>
                      <div className="text-sm mt-1">
                        长度: {configStatus.falKey?.length} 字符 | 
                        格式: {configStatus.falKey?.validFormat ? '✅ 正确' : '❌ 错误'}
                      </div>
                      {configStatus.falKey?.preview && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          预览: {configStatus.falKey.preview}
                        </div>
                      )}
                    </div>
                    <FontAwesomeIcon 
                      icon={getStatusIcon(configStatus.falKey?.status)} 
                      className="text-xl" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 登录密码状态 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <FontAwesomeIcon icon={faLock} className="mr-2 text-green-500" />
                APP_PASSWORD 状态
              </h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border ${getStatusColor(configStatus.appPassword?.status)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {configStatus.appPassword?.exists ? '✅ 登录密码已设置' : '❌ 登录密码未找到'}
                      </div>
                      <div className="text-sm mt-1">
                        长度: {configStatus.appPassword?.length} 字符
                      </div>
                    </div>
                    <FontAwesomeIcon 
                      icon={getStatusIcon(configStatus.appPassword?.status)} 
                      className="text-xl" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* API 连接测试 */}
            {configStatus.apiTest && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔌 API 连接测试</h3>
                <div className={`p-4 rounded-lg border ${getStatusColor(configStatus.apiTest.status)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {configStatus.apiTest.success ? '✅ API 连接成功' : '❌ API 连接失败'}
                      </div>
                      {configStatus.apiTest.error && (
                        <div className="text-sm mt-1 text-red-600">
                          错误: {configStatus.apiTest.error}
                        </div>
                      )}
                      {configStatus.apiTest.responseTime && (
                        <div className="text-sm mt-1 text-gray-600">
                          响应时间: {configStatus.apiTest.responseTime}ms
                        </div>
                      )}
                    </div>
                    <FontAwesomeIcon 
                      icon={getStatusIcon(configStatus.apiTest.status)} 
                      className="text-xl" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 建议和解决方案 */}
            {configStatus.recommendations && configStatus.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 建议和解决方案</h3>
                <div className="space-y-3">
                  {configStatus.recommendations.map((rec, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusColor(rec.type)}`}>
                      <div className="font-medium">{rec.title}</div>
                      <div className="text-sm mt-1">{rec.description}</div>
                      {rec.action && (
                        <div className="text-sm mt-2 font-medium">
                          💡 解决方案: {rec.action}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 快速操作 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">🚀 快速操作</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="/" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center transition-colors"
                >
                  返回主页
                </a>
                <a 
                  href="/login" 
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center transition-colors"
                >
                  测试登录
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}