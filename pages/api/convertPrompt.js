// API endpoint to convert natural language to optimized image generation prompts using Zhipu AI (智谱)
import crypto from 'crypto';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: '请提供文本内容' });
    }

    // 智谱 API 配置 - 直接使用提供的API密钥
    // 注意：在生产环境中应该使用环境变量来存储这个密钥
    const API_KEY = "24c17f3d014842898c472e8110024767.Ge1hlG9zkHqBdzlj";

    // 智谱API使用API Key直接认证，不需要生成JWT Token

    // 准备请求数据 - 简化为基本的中英文翻译
    const messages = [
      {
        role: 'system',
        content: '你是一个精准的中英文翻译工具。请将用户提供的中文准确地翻译成英文。不要添加额外的内容或解释，只需要提供翻译结果。'
      },
      {
        role: 'user',
        content: `请将以下中文翻译成英文："${prompt}"`
      }
    ];

    let convertedPrompt;
    console.log('开始调用智谱API，原始中文提示词：', prompt);
    
    try {
      // 调用智谱API
      console.log('发送请求到智谱API，消息内容：', JSON.stringify(messages));
      
      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: 'glm-4', // 使用GLM-4模型
          messages: messages,
          temperature: 0.7,
          max_tokens: 256
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );
      
      console.log('智谱API响应数据：', JSON.stringify(response.data));

      // 从响应中提取转换后的提示词
      convertedPrompt = response.data.choices[0].message.content.trim();
      console.log('提取的转换后提示词：', convertedPrompt);
    } catch (apiError) {
      console.error('智谱API调用失败:', apiError);
      return res.status(500).json({ 
        message: '转换提示词时出错',
        error: apiError.message 
      });
    }

    return res.status(200).json({ 
      originalPrompt: prompt,
      convertedPrompt: convertedPrompt 
    });
  } catch (error) {
    console.error('Error converting prompt:', error);
    return res.status(500).json({ 
      message: '转换提示词时出错',
      error: error.message 
    });
  }
}
