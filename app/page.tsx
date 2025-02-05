// app/page.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Define interfaces for our data types
interface AnalyzedResult {
  Title: string;
  Description: string;
  'Contract Value': string;
  'Material Estimate': string;
  Source: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalyzedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleProcess = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    try {
      // Step 1: Scraping
      setStatus('Scraping articles...');
      const scrapeResponse = await fetch('/api/scrape?maxPages=1');
      if (!scrapeResponse.ok) {
        throw new Error('Scraping failed');
      }
      const scrapeData = await scrapeResponse.json();
      setStatus(`Scraped ${scrapeData.articles.length} articles. Analyzing...`);

      // Step 2: Analysis
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: scrapeData.articles
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error('Analysis failed');
      }

      const analyzeData = await analyzeResponse.json();
      setResults(analyzeData.analyzedData);
      setStatus('Complete!');
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setStatus('Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Metro Rail Project Analyzer</h1>
          <Button 
            onClick={handleProcess} 
            disabled={isLoading}
            className="w-32"
          >
            {isLoading ? 'Processing...' : 'Go'}
          </Button>
          
          {status && (
            <p className="mt-4 text-gray-600">{status}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <Card key={index} className="p-6">
                <h2 className="text-xl font-bold mb-2">{result.Title}</h2>
                <div className="space-y-2">
                  <p><span className="font-semibold">Description:</span> {result.Description}</p>
                  <p><span className="font-semibold">Contract Value:</span> {result['Contract Value']}</p>
                  <p><span className="font-semibold">Material Estimate:</span> {result['Material Estimate']}</p>
                  <p><span className="font-semibold">Source:</span> {result.Source}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}