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
    if (!APP_PASSWORD) {
      console.warn('APP_PASSWORD is not set in environment variables');
    }

    if (password === APP_PASSWORD) {
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
      return res.status(401).json({ message: 'Invalid password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
}
