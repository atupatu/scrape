import { MetroRailScraper } from '../../lib/scraper';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const maxPages = req.query.maxPages ? parseInt(req.query.maxPages) : 1;
    const scraper = new MetroRailScraper();
    const articles = await scraper.scrapeSite(maxPages);
    
    res.status(200).json({ articles });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape articles' });
  }
}