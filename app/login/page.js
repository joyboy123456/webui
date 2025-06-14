"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('发送登录请求...');
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      console.log('登录响应状态:', res.status);
      const data = await res.json();
      console.log('登录响应数据:', data);

      if (res.ok) {
        console.log('登录成功，跳转到首页');
        router.push("/");
      } else {
        console.log('登录失败:', data.message);
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error('Login request error:', err);
      setError("网络错误，请检查连接");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="apple-card-elevated p-8 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Image Studio</h1>
          <p className="text-gray-500">Enter password to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-3">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="apple-input"
              required
              disabled={loading}
            />
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="apple-button-primary w-full text-center font-semibold text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              💡 <strong>设置说明:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>在项目根目录创建 <code className="bg-blue-100 px-1 rounded">.env.local</code> 文件</li>
              <li>添加 <code className="bg-blue-100 px-1 rounded">APP_PASSWORD=你的密码</code></li>
              <li>重启开发服务器</li>
            </ol>
            <p className="text-xs text-blue-600 mt-2">
              默认密码已设置为: <code className="bg-blue-100 px-1 rounded">123456</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}