import { callServerAI } from '../services/gemini';

export interface MCQ {
  question: string;
  options: { A: string, B: string, C: string, D: string };
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const convertToMCQs = async (inputData: string): Promise<MCQ[]> => {
  const prompt = `Convert this material into NCERT-based NEET MCQs. Provide output STRICTLY in JSON format as an array of objects.
  Format: { "questions": [ { "question": "...", "options": { "A": "...", "B": "...", "C": "...", "D": "..." }, "correct_answer": "A/B/C/D", "explanation": "Short clear explanation", "subject": "Biology", "difficulty": "Medium" } ] }
  
  Input Data:
  ${inputData}
  `;

  try {
    const response = await callServerAI('/api/ask', {
      question: prompt,
      context: "NEET Content Converter"
    });

    const content = typeof response.answer === 'string' ? response.answer : JSON.stringify(response.answer);
    
    // Clean up markdown
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);
    
    return result.questions || [];
  } catch (error) {
    console.error("AI Conversion failed:", error);
    return [];
  }
};
