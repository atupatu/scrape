// scripts/cron-job.js
const { MetroRailScraper } = require('../lib/scraper');
const { analyzeMultipleArticles } = require('../lib/analyzer');

async function runCronJob() {
  try {
    console.log('Starting cron job...');
    
    // Initialize scraper
    const scraper = new MetroRailScraper();
    console.log('Scraping articles...');
    const scrapedData = await scraper.scrape_site(1);
    
    // Analyze articles
    console.log(`Found ${scrapedData.length} articles. Starting analysis...`);
    const analysisResult = await analyzeMultipleArticles(scrapedData);
    
    console.log('Analysis complete:', {
      analyzed: analysisResult.analyzedData.length,
      skipped: analysisResult.skipped?.length || 0,
      errors: analysisResult.errors?.length || 0
    });
    
  } catch (error) {
    console.error('Cron job failed:', error);
    process.exit(1);
  }
}

runCronJob();