// 测试 FAL API 连接的调试端点
import * as fal from "@fal-ai/serverless-client";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== FAL API 测试开始 ===');
    
    // 检查环境变量
    const FAL_KEY = process.env.FAL_KEY;
    console.log('FAL_KEY 存在:', !!FAL_KEY);
    console.log('FAL_KEY 长度:', FAL_KEY ? FAL_KEY.length : 0);
    
    if (!FAL_KEY) {
      return res.status(500).json({ 
        error: 'FAL_KEY 环境变量未设置',
        message: '请在 .env.local 文件中设置 FAL_KEY'
      });
    }

    // 配置 FAL 客户端
    fal.config({
      credentials: FAL_KEY,
    });

    console.log('FAL 客户端配置完成');

    // 测试简单的图片生成
    const testInput = {
      prompt: "a simple red apple on white background",
      image_size: "square_hd",
      num_inference_steps: 4,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true,
      output_format: "jpeg"
    };

    console.log('开始测试 API 调用...');
    console.log('测试输入:', testInput);

    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: testInput,
      sync_mode: true,
    });

    console.log('API 调用成功!');
    console.log('结果:', result);

    return res.status(200).json({
      success: true,
      message: 'FAL API 连接正常',
      result: result,
      testInput: testInput
    });

  } catch (error) {
    console.error('FAL API 测试失败:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);

    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'FAL API 测试失败',
      details: error.stack
    });
  }
}