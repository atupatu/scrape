// pages/api/analyze.js
import { analyzeMultipleArticles } from '../../lib/analyzer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { articles } = req.body;
    if (!articles || !Array.isArray(articles)) {
      return res.status(400).json({ error: 'Invalid articles data' });
    }

    const result = await analyzeMultipleArticles(articles);
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze articles'
    });
  }
}