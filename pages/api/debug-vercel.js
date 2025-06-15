// 专门用于调试Vercel环境的API端点
export default async function handler(req, res) {
  console.log('🔍 开始Vercel环境调试...');
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      isVercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      vercelUrl: process.env.VERCEL_URL,
    },
    environmentVariables: {
      falKey: {
        exists: !!process.env.FAL_KEY,
        length: process.env.FAL_KEY ? process.env.FAL_KEY.length : 0,
        preview: process.env.FAL_KEY ? process.env.FAL_KEY.substring(0, 8) + '...' : null,
        startsWithExpected: process.env.FAL_KEY ? process.env.FAL_KEY.startsWith('fal-') : false
      },
      appPassword: {
        exists: !!process.env.APP_PASSWORD,
        length: process.env.APP_PASSWORD ? process.env.APP_PASSWORD.length : 0
      }
    },
    directories: {
      cwd: process.cwd(),
      tmpExists: require('fs').existsSync('/tmp'),
      tmpWritable: (() => {
        try {
          require('fs').writeFileSync('/tmp/test.txt', 'test');
          require('fs').unlinkSync('/tmp/test.txt');
          return true;
        } catch (e) {
          return false;
        }
      })()
    }
  };

  // 测试FAL API连接
  if (process.env.FAL_KEY) {
    try {
      console.log('🧪 测试FAL API连接...');
      
      // 动态导入fal客户端
      const fal = await import("@fal-ai/serverless-client");
      
      fal.config({
        credentials: process.env.FAL_KEY,
      });

      // 简单的API测试
      const testResult = await fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt: "test",
          image_size: "square_hd",
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true,
          output_format: "jpeg"
        },
        sync_mode: true,
      });

      debugInfo.falApiTest = {
        success: true,
        hasImages: !!(testResult && testResult.images && testResult.images.length > 0),
        imageCount: testResult?.images?.length || 0,
        firstImageUrl: testResult?.images?.[0]?.url || null
      };

    } catch (error) {
      console.error('❌ FAL API测试失败:', error);
      debugInfo.falApiTest = {
        success: false,
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack
      };
    }
  } else {
    debugInfo.falApiTest = {
      success: false,
      error: "FAL_KEY not found"
    };
  }

  console.log('📊 调试信息:', JSON.stringify(debugInfo, null, 2));

  res.status(200).json({
    message: 'Vercel环境调试完成',
    debug: debugInfo,
    recommendations: generateRecommendations(debugInfo)
  });
}

function generateRecommendations(debugInfo) {
  const recommendations = [];

  if (!debugInfo.environmentVariables.falKey.exists) {
    recommendations.push({
      type: 'error',
      title: 'FAL_KEY未设置',
      description: '在Vercel Dashboard中添加FAL_KEY环境变量',
      action: '项目设置 → Environment Variables → 添加FAL_KEY'
    });
  } else if (!debugInfo.environmentVariables.falKey.startsWithExpected) {
    recommendations.push({
      type: 'warning',
      title: 'FAL_KEY格式可能不正确',
      description: 'FAL API密钥通常以"fal-"开头',
      action: '检查API密钥格式是否正确'
    });
  }

  if (debugInfo.falApiTest && !debugInfo.falApiTest.success) {
    if (debugInfo.falApiTest.error.includes('credentials') || debugInfo.falApiTest.error.includes('unauthorized')) {
      recommendations.push({
        type: 'error',
        title: 'API密钥无效',
        description: 'FAL_KEY可能已过期或无效',
        action: '重新生成API密钥并更新环境变量'
      });
    } else if (debugInfo.falApiTest.error.includes('quota') || debugInfo.falApiTest.error.includes('limit')) {
      recommendations.push({
        type: 'warning',
        title: 'API配额不足',
        description: '账户余额不足或达到使用限制',
        action: '检查fal.ai账户余额和使用限制'
      });
    } else {
      recommendations.push({
        type: 'info',
        title: 'API连接问题',
        description: debugInfo.falApiTest.error,
        action: '检查网络连接和API服务状态'
      });
    }
  }

  if (!debugInfo.directories.tmpWritable) {
    recommendations.push({
      type: 'error',
      title: '临时目录不可写',
      description: 'Vercel环境中/tmp目录无法写入',
      action: '这可能是Vercel配置问题，需要检查函数权限'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      title: '环境配置正常',
      description: '所有检查项都通过了',
      action: '如果仍有问题，请检查前端错误日志'
    });
  }

  return recommendations;
}