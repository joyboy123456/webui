export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    console.log('🔍 开始验证 Vercel 配置...');
    
    const startTime = Date.now();
    
    // 检查环境信息
    const environment = {
      platform: process.env.VERCEL ? 'Vercel' : 'Local',
      nodeEnv: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL,
      timestamp: new Date().toISOString()
    };

    // 检查 FAL_KEY
    const FAL_KEY = process.env.FAL_KEY;
    const falKeyCheck = {
      exists: !!FAL_KEY,
      length: FAL_KEY ? FAL_KEY.length : 0,
      preview: FAL_KEY ? FAL_KEY.substring(0, 10) + '...' : null,
      validFormat: FAL_KEY ? FAL_KEY.startsWith('fal-') : false,
      status: 'error'
    };

    if (falKeyCheck.exists && falKeyCheck.validFormat && falKeyCheck.length > 20) {
      falKeyCheck.status = 'success';
    } else if (falKeyCheck.exists) {
      falKeyCheck.status = 'warning';
    }

    // 检查 APP_PASSWORD
    const APP_PASSWORD = process.env.APP_PASSWORD;
    const appPasswordCheck = {
      exists: !!APP_PASSWORD,
      length: APP_PASSWORD ? APP_PASSWORD.length : 0,
      status: !!APP_PASSWORD ? 'success' : 'error'
    };

    // API 连接测试
    let apiTest = null;
    if (falKeyCheck.status === 'success') {
      try {
        console.log('🧪 测试 FAL API 连接...');
        
        // 动态导入 fal 客户端
        const fal = await import("@fal-ai/serverless-client");
        
        fal.config({
          credentials: FAL_KEY,
        });

        const testStartTime = Date.now();
        
        // 简单的 API 测试
        const testResult = await fal.subscribe("fal-ai/flux/schnell", {
          input: {
            prompt: "test connection",
            image_size: "square_hd",
            num_inference_steps: 4,
            num_images: 1,
            enable_safety_checker: true,
            output_format: "jpeg"
          },
          sync_mode: true,
        });

        const responseTime = Date.now() - testStartTime;

        apiTest = {
          success: true,
          status: 'success',
          responseTime: responseTime,
          hasImages: !!(testResult && testResult.images && testResult.images.length > 0),
          imageCount: testResult?.images?.length || 0
        };

        console.log('✅ API 连接测试成功');

      } catch (error) {
        console.error('❌ API 连接测试失败:', error);
        
        let errorStatus = 'error';
        if (error.message.includes('credentials') || error.message.includes('unauthorized')) {
          errorStatus = 'error';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorStatus = 'warning';
        }

        apiTest = {
          success: false,
          status: errorStatus,
          error: error.message,
          errorType: error.constructor.name
        };
      }
    }

    // 生成建议
    const recommendations = [];
    
    if (!falKeyCheck.exists) {
      recommendations.push({
        type: 'error',
        title: 'FAL_KEY 未设置',
        description: '在 Vercel Dashboard 中添加 FAL_KEY 环境变量',
        action: '项目设置 → Environment Variables → 添加 FAL_KEY'
      });
    } else if (!falKeyCheck.validFormat) {
      recommendations.push({
        type: 'warning',
        title: 'FAL_KEY 格式不正确',
        description: 'API 密钥应该以 "fal-" 开头',
        action: '检查 API 密钥是否完整复制'
      });
    } else if (falKeyCheck.length < 20) {
      recommendations.push({
        type: 'warning',
        title: 'FAL_KEY 可能不完整',
        description: 'API 密钥长度似乎太短',
        action: '重新复制完整的 API 密钥'
      });
    }

    if (!appPasswordCheck.exists) {
      recommendations.push({
        type: 'warning',
        title: 'APP_PASSWORD 未设置',
        description: '建议设置登录密码保护应用',
        action: '在环境变量中添加 APP_PASSWORD'
      });
    }

    if (apiTest && !apiTest.success) {
      if (apiTest.error.includes('credentials') || apiTest.error.includes('unauthorized')) {
        recommendations.push({
          type: 'error',
          title: 'API 密钥无效',
          description: 'FAL_KEY 可能已过期或无效',
          action: '重新生成 API 密钥并更新环境变量'
        });
      } else if (apiTest.error.includes('quota') || apiTest.error.includes('limit')) {
        recommendations.push({
          type: 'warning',
          title: 'API 配额不足',
          description: '账户余额不足或达到使用限制',
          action: '检查 fal.ai 账户余额'
        });
      } else {
        recommendations.push({
          type: 'info',
          title: 'API 连接问题',
          description: apiTest.error,
          action: '检查网络连接和 API 服务状态'
        });
      }
    }

    // 确定总体状态
    let overallStatus = 'success';
    let message = '🎉 所有配置都正确！你的应用已准备就绪。';

    if (recommendations.some(r => r.type === 'error')) {
      overallStatus = 'error';
      message = '❌ 发现严重配置问题，需要立即修复。';
    } else if (recommendations.some(r => r.type === 'warning')) {
      overallStatus = 'warning';
      message = '⚠️ 配置基本正确，但有一些建议改进的地方。';
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        title: '配置完美',
        description: '所有检查项都通过了',
        action: '你可以开始使用应用了！'
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`📊 配置验证完成，耗时: ${totalTime}ms`);

    res.status(200).json({
      overallStatus,
      message,
      environment,
      falKey: falKeyCheck,
      appPassword: appPasswordCheck,
      apiTest,
      recommendations,
      verificationTime: totalTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 配置验证失败:', error);
    
    res.status(500).json({
      overallStatus: 'error',
      message: '配置验证过程中发生错误',
      error: error.message,
      recommendations: [{
        type: 'error',
        title: '验证失败',
        description: error.message,
        action: '检查服务器日志获取更多信息'
      }]
    });
  }
}