// 临时调试 API 端点
export default function handler(req, res) {
  console.log('=== 环境变量检查 ===');
  console.log('FAL_KEY 存在:', !!process.env.FAL_KEY);
  console.log('FAL_KEY 长度:', process.env.FAL_KEY ? process.env.FAL_KEY.length : 0);
  console.log('APP_PASSWORD 存在:', !!process.env.APP_PASSWORD);
  
  res.status(200).json({
    falKeyExists: !!process.env.FAL_KEY,
    falKeyLength: process.env.FAL_KEY ? process.env.FAL_KEY.length : 0,
    appPasswordExists: !!process.env.APP_PASSWORD,
    nodeEnv: process.env.NODE_ENV
  });
}