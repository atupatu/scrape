import axios from 'axios';
import * as cheerio from 'cheerio';

export class MetroRailScraper {
  constructor() {
    this.baseUrl = "https://themetrorailguy.com/";
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
  }

  async getSoup(url) {
    try {
      const response = await axios.get(url, { headers: this.headers });
      return cheerio.load(response.data);
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  }

  async getArticleContent(url) {
    const $ = await this.getSoup(url);
    if (!$) return "Failed to fetch article content";

    const articleContent = $('.entry-content');
    if (articleContent.length) {
      articleContent.find('script').remove();
      return articleContent.text().trim();
    }
    return "No content found";
  }

  async extractArticleInfo(article) {
    const $ = cheerio.load(article);
    const data = {};

    const titleTag = $('h1.post-title a');
    if (titleTag.length) {
      data.title = titleTag.text().trim();
      data.url = titleTag.attr('href');
    }

    const dateContainer = $('.date-container');
    if (dateContainer.length) {
      data.date = `${dateContainer.find('strong').text()} ${dateContainer.find('span').text()}`;
    }

    const categoryTag = $('.blog-categories a');
    if (categoryTag.length) {
      data.category = categoryTag.text().trim();
    }

    const commentsTag = $('.comment-container strong');
    if (commentsTag.length) {
      data.comments = commentsTag.text().trim();
    }

    const excerptTag = $('.entry-content p').first();
    if (excerptTag.length) {
      data.excerpt = excerptTag.text().trim();
    }

    if (data.url) {
      console.log(`Fetching content for: ${data.title}`);
      data.full_content = await this.getArticleContent(data.url);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return data;
  }

  async scrapeSite(maxPages = null) {
    const articlesData = [];
    let currentPage = 1;

    while (true) {
      const url = currentPage === 1 ? this.baseUrl : `${this.baseUrl}page/${currentPage}/`;
      console.log(`Scraping page ${currentPage}`);

      const $ = await this.getSoup(url);
      if (!$) break;

      const articles = $('.post-entry');
      if (!articles.length) break;

      for (const article of articles) {
        const articleData = await this.extractArticleInfo(article);
        if (articleData) {
          articlesData.push(articleData);
        }
      }

      if (maxPages && currentPage >= maxPages) break;

      currentPage++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return articlesData;
  }
}