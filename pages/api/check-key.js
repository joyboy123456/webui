export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const FAL_KEY = process.env.FAL_KEY;
    
    const keyCheck = {
      exists: !!FAL_KEY,
      length: FAL_KEY ? FAL_KEY.length : 0,
      preview: FAL_KEY ? FAL_KEY.substring(0, 10) + '...' : null,
      startsWithFal: FAL_KEY ? FAL_KEY.startsWith('fal-') : false,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    console.log('🔑 API Key Check:', keyCheck);

    // Don't expose the actual key in response for security
    const safeResponse = {
      keyExists: keyCheck.exists,
      keyLength: keyCheck.length,
      keyPreview: keyCheck.preview,
      validFormat: keyCheck.startsWithFal,
      environment: keyCheck.environment,
      timestamp: keyCheck.timestamp,
      status: keyCheck.exists && keyCheck.startsWithFal ? 'valid' : 'invalid',
      recommendations: []
    };

    if (!keyCheck.exists) {
      safeResponse.recommendations.push({
        issue: 'API key not found',
        solution: 'Add FAL_KEY to your .env.local file'
      });
    } else if (!keyCheck.startsWithFal) {
      safeResponse.recommendations.push({
        issue: 'Invalid key format',
        solution: 'FAL API keys should start with "fal-"'
      });
    } else if (keyCheck.length < 20) {
      safeResponse.recommendations.push({
        issue: 'Key seems too short',
        solution: 'Verify you copied the complete API key'
      });
    } else {
      safeResponse.recommendations.push({
        issue: 'None',
        solution: 'API key appears to be properly configured'
      });
    }

    res.status(200).json(safeResponse);
  } catch (error) {
    console.error('Key check error:', error);
    res.status(500).json({ 
      message: 'Error checking API key',
      error: error.message 
    });
  }
}