// 检查环境变量的调试端点
export default function handler(req, res) {
  console.log('=== 环境变量检查 ===');
  
  const envCheck = {
    FAL_KEY: {
      exists: !!process.env.FAL_KEY,
      length: process.env.FAL_KEY ? process.env.FAL_KEY.length : 0,
      preview: process.env.FAL_KEY ? process.env.FAL_KEY.substring(0, 10) + '...' : null
    },
    APP_PASSWORD: {
      exists: !!process.env.APP_PASSWORD,
      length: process.env.APP_PASSWORD ? process.env.APP_PASSWORD.length : 0
    },
    NODE_ENV: process.env.NODE_ENV,
    // 检查其他可能相关的环境变量
    VERCEL: process.env.VERCEL,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL
  };

  console.log('环境变量状态:', envCheck);

  res.status(200).json({
    message: '环境变量检查完成',
    env: envCheck,
    timestamp: new Date().toISOString()
  });
}