"use client";
import { useState } from 'react';

export default function DebugPage() {
  const [envCheck, setEnvCheck] = useState(null);
  const [falTest, setFalTest] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkEnvironment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-env');
      const data = await response.json();
      setEnvCheck(data);
    } catch (error) {
      console.error('环境检查失败:', error);
      setEnvCheck({ error: error.message });
    }
    setLoading(false);
  };

  const testFalAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setFalTest(data);
    } catch (error) {
      console.error('FAL API 测试失败:', error);
      setFalTest({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">调试面板</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 环境变量检查 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">环境变量检查</h2>
            <button
              onClick={checkEnvironment}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
            >
              {loading ? '检查中...' : '检查环境变量'}
            </button>
            
            {envCheck && (
              <div className="bg-gray-100 p-4 rounded">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(envCheck, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* FAL API 测试 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">FAL API 测试</h2>
            <button
              onClick={testFalAPI}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 mb-4"
            >
              {loading ? '测试中...' : '测试 FAL API'}
            </button>
            
            {falTest && (
              <div className="bg-gray-100 p-4 rounded">
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(falTest, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">常见问题排查</h3>
          <ul className="text-yellow-700 space-y-2">
            <li>• 确保 .env.local 文件中设置了正确的 FAL_KEY</li>
            <li>• 检查 FAL API 密钥是否有效且有足够的配额</li>
            <li>• 确认网络连接正常</li>
            <li>• 查看浏览器控制台是否有错误信息</li>
            <li>• 检查服务器日志中的详细错误信息</li>
          </ul>
        </div>
      </div>
    </div>
  );
}