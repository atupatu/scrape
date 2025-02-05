const Groq = require('groq-sdk');
const { MongoClient } = require('mongodb');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function storeAnalysis(analysis, articleUrl) {
  try {
    const client = await clientPromise;
    const db = client.db("metroProjects");
    const collection = db.collection("analyses");

    // Check if analysis for this URL already exists
    const existing = await collection.findOne({ url: articleUrl });
    
    if (existing) {
      console.log(`Analysis for URL ${articleUrl} already exists, skipping...`);
      return { status: 'skipped', existing };
    }

    // If no existing entry, insert new analysis
    const result = await collection.insertOne({
      ...analysis,
      url: articleUrl,
      analyzedAt: new Date(),
    });

    console.log(`Stored analysis for ${articleUrl}`);
    return { status: 'inserted', id: result.insertedId };
  } catch (error) {
    console.error('Error storing analysis:', error);
    throw error;
  }
}

async function analyzeArticle(articleData) {
  try {
    const prompt = `
      You are a specialized analyzer for metro rail projects. Analyze the provided article and extract key information:

      Context: This is an article about a metro rail project. Extract and infer the following details with high accuracy.
      If exact numbers aren't mentioned, make educated estimates based on similar projects and industry standards.

      Article Title: ${articleData.title}
      Article Content: ${articleData.full_content}

      Please analyze and provide:
      1. Project Title (cleaned and standardized format)
      2. A concise but informative 2-3 sentence description of the project scope
      3. Contract Value in Cr (if not mentioned, estimate based on project scope)
      4. Material Requirements:
         - Estimated steel requirement in Metric Tons
         - Estimated concrete requirement in Metric Tons
         (Use industry standards if not explicitly mentioned)
      5. Source verification and project status

      Format your response exactly like this:
      Title: <project title>
      Description: <2-3 sentence description>
      Contract Value: <value in Cr>
      Material Estimate: <total material estimate in MT>
      Source: <source info>
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768",
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    const parsedAnalysis = parseResponse(content, articleData.url);
    
    // Store in MongoDB and get result
    const storageResult = await storeAnalysis(parsedAnalysis, articleData.url);
    
    return {
      ...parsedAnalysis,
      storageStatus: storageResult.status
    };
  } catch (error) {
    console.error('Error analyzing article:', error);
    throw error;
  }
}

function parseResponse(content, sourceUrl) {
  const parsed = {};
  let currentField = null;

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (trimmedLine.includes(':')) {
      const [field, ...valueParts] = trimmedLine.split(':');
      currentField = field.trim();
      parsed[currentField] = valueParts.join(':').trim();
    } else if (currentField) {
      parsed[currentField] += ' ' + trimmedLine;
    }
  }

  if (sourceUrl && parsed.Source) {
    parsed.Source = `${parsed.Source} (${sourceUrl})`;
  }

  return parsed;
}

async function analyzeMultipleArticles(articles) {
  const results = [];
  const errors = [];
  const skipped = [];

  for (const article of articles) {
    try {
      console.log(`Analyzing article: ${article.title}`);
      const analysis = await analyzeArticle(article);
      
      if (analysis.storageStatus === 'skipped') {
        skipped.push({ title: article.title, url: article.url });
      } else {
        results.push(analysis);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to analyze article '${article.title}':`, error);
      errors.push({ title: article.title, error: error.message });
    }
  }

  return {
    analyzedData: results,
    skipped: skipped.length > 0 ? skipped : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}

export { analyzeMultipleArticles };