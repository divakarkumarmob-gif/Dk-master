import { callServerAI, AIManager } from './gemini';

const manager = AIManager.getInstance();

export const gemmaService = {
  // Offline-optimized concept understanding (cached heavily)
  async understandConcept(concept: string): Promise<string> {
    const key = `gemma_offline_${concept.toLowerCase().trim()}`;
    return manager.executeSafeCall(key, async () => {
      const resp = await (callServerAI as any)('/api/ask', {
        question: `Explain this concept simply for NEET preparation: ${concept}. Reference NCERT.`,
        context: "Gemma-4-E2B-it Mode: Tactical Accuracy, NCERT Focused."
      });
      return resp.answer || "Concept analysis pending.";
    }, "Neural link busy. Offline protocol optimized.", 'STATIC', 'high');
  },

  // Youtube content recommendation
  async getBestYoutubeVideo(topic: string): Promise<{ id: string, blocked?: boolean } | null> {
    return manager.executeSafeCall(`ytgemma_${topic}`, async () => {
      const resp = await (callServerAI as any)('/api/youtube-search', { topic });
      return resp ? { id: resp.id, blocked: resp.blocked } : null;
    }, null, 'STATIC', 'background');
  }
};
