// pages/api/login.js

import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password required' });
    }

    const APP_PASSWORD = process.env.APP_PASSWORD;
    
    console.log('登录尝试 - 环境变量检查:');
    console.log('APP_PASSWORD 存在:', !!APP_PASSWORD);
    console.log('APP_PASSWORD 值:', APP_PASSWORD);
    console.log('输入的密码:', password);
    
    if (!APP_PASSWORD) {
      console.error('APP_PASSWORD is not set in environment variables');
      return res.status(500).json({ 
        message: '服务器配置错误：未设置登录密码。请在 .env.local 文件中设置 APP_PASSWORD 环境变量。' 
      });
    }

    if (password === APP_PASSWORD) {
      console.log('密码验证成功');
      // Set auth cookie valid for 7 days
      const cookie = serialize('auth', 'true', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      res.setHeader('Set-Cookie', cookie);
      return res.status(200).json({ message: 'Authenticated' });
    } else {
      console.log('密码验证失败');
      return res.status(401).json({ message: 'Invalid password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
}