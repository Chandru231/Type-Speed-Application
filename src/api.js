/**
 * API Service - Fetches quotes from external API
 */

const API_KEY = process.env.QUOTES_API_KEY;
const API_URL = 'https://api.api-ninjas.com/v1/quotes';

// Simple words for fallback
const WORDS = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
  'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make'
];

/**
 * Fetch quotes from API
 */
export async function fetchQuotes(count = 3) {
  const quotes = [];
  
  for (let i = 0; i < count; i++) {
    const response = await fetch(API_URL, {
      headers: { 'X-Api-Key': API_KEY }
    });
    
    if (!response.ok) throw new Error('API Error');
    
    const data = await response.json();
    if (data[0]?.quote) quotes.push(data[0].quote);
  }
  
  return quotes.join(' ');
}

/**
 * Generate random text locally (fallback)
 */
export function generateLocalText(wordCount = 50) {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}
