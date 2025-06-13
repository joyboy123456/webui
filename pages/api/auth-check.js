export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 检查认证cookie
    const authCookie = req.cookies.auth;
    
    if (authCookie === 'true') {
      return res.status(200).json({ authenticated: true });
    } else {
      return res.status(401).json({ authenticated: false });
    }
  } catch (err) {
    console.error('Auth check error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
} 