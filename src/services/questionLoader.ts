
export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const BASE_URL = 'https://raw.githubusercontent.com/divakarkumarmob-gif/neet-data/main';
const CHUNKS = ['chunk_aa.json']; // Add more chunks here: ['chunk_aa.json', 'chunk_ab.json']

class QuestionLoader {
  private cache: Map<string, Question[]> = new Map();

  async getRandomQuestions(count: number): Promise<Question[]> {
    // 1. Pick a random chunk
    const randomChunk = CHUNKS[Math.floor(Math.random() * CHUNKS.length)];
    
    // 2. Fetch if not in cache
    if (!this.cache.has(randomChunk)) {
      const url = `${BASE_URL}/${randomChunk}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch chunk: ${url} (Status: ${response.status})`);
      }
      const data = await response.json();
      // Assuming structure is { biolog: [...] }
      this.cache.set(randomChunk, data.biolog || []);
    }

    const available = this.cache.get(randomChunk) || [];
    
    // 3. Shuffle and slice
    return [...available]
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  }
}

export const questionLoader = new QuestionLoader();
