// scripts/cron-job.js
const { MetroRailScraper } = require('../lib/scraper');
const { analyzeMultipleArticles } = require('../lib/analyzer');

async function runCronJob() {
  try {
    console.log('Starting cron job...');
    
    // Initialize scraper
    const scraper = new MetroRailScraper();
    console.log('Scraping articles...');
    const scrapedData = await scraper.scrapeSite(1);  // Changed from scrape_site to scrapeSite to match the class method
    
    if (!scrapedData || scrapedData.length === 0) {
      console.log('No articles found to analyze');
      process.exit(0);
    }
    
    // Analyze articles
    console.log(`Found ${scrapedData.length} articles. Starting analysis...`);
    const analysisResult = await analyzeMultipleArticles(scrapedData);
    
    console.log('Analysis complete:', {
      analyzed: analysisResult.analyzedData.length,
      skipped: analysisResult.skipped?.length || 0,
      errors: analysisResult.errors?.length || 0
    });

    // Successful execution
    process.exit(0);
    
  } catch (error) {
    console.error('Cron job failed:', error);
    process.exit(1);
  }
}

// Handle any unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the job
runCronJob();