import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  RefreshCcw, 
  Brain, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Loader2,
  X,
  Target
} from 'lucide-react';
import { useAppStore, getDailyChapters } from '../store/useAppStore';
import { geminiService } from '../services/gemini';
import { cn } from '../lib/utils';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
}

export const SmartFlashcards: React.FC = () => {
  const { theme } = useAppStore();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const dailyData = getDailyChapters();

  const generateFlashcards = async () => {
    setLoading(true);
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    try {
      const chapterList = Object.entries(dailyData.chapters).map(([s, c]) => `${s}: ${c}`).sort().join(', ');
      const cacheKey = `flashcards_${chapterList.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      
      const prompt = `Act as an expert NEET educator. Generate 8 high-impact 'Smart Flashcards' (Front: Concept/Question, Back: Concise Answer) for these NCERT chapters: ${chapterList}. 
      Focus on tricky terms, diagrams, values, or scientist names. 
      Format: JSON array of objects with 'id', 'front', 'back', 'subject'.
      Plain text only. No symbols.`;
      
      const response = await geminiService.solveDoubt(prompt, undefined, undefined, cacheKey);
      if (response) {
        // Simple extraction since AI might output text around it
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setCards(parsed);
        } else {
            // Fallback parsing if JSON isn't perfect
            console.warn("Flashcard JSON parse failed, falling back.");
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="space-y-4">
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && cards.length === 0) generateFlashcards();
        }}
        className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden cursor-pointer"
      >
        <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <Zap size={20} className="text-yellow-300" />
                    Smart Flashcards
                </h3>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter italic">
                    {isOpen ? 'Close Memory Deck' : 'Neural Active Recall Exercise'}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Brain size={24} className={cn("opacity-20 transition-transform duration-500", isOpen ? "scale-125 rotate-45" : "")} />
                <ChevronRight size={18} className={cn("transition-transform duration-300", isOpen ? "rotate-90" : "")} />
            </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {loading ? (
                <div className="p-10 flex flex-col items-center gap-4 bg-white dark:bg-zinc-900 rounded-[32px] border border-line dark:border-white/5">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Sequencing Neural Pathways...</p>
                </div>
            ) : cards.length > 0 ? (
                <div className="space-y-6 pt-2">
                    <div className="flex justify-between items-center px-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                            Card {currentIndex + 1} of {cards.length}
                        </span>
                        <button 
                            onClick={generateFlashcards}
                            className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 hover:opacity-70"
                        >
                            <RefreshCcw size={12} />
                            Reset Deck
                        </button>
                    </div>

                    <div className="perspective-1000 h-64 relative group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                        <motion.div 
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="w-full h-full relative preserve-3d"
                        >
                            {/* Front Side */}
                            <div className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 border-2 border-emerald-500/20 dark:border-emerald-500/40 rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-xl">
                                <div className="absolute top-6 left-6 flex items-center gap-2">
                                    <Target size={14} className="text-emerald-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">{cards[currentIndex]?.subject}</span>
                                </div>
                                <h4 className="text-lg font-bold text-text-main dark:text-white leading-snug">
                                    {cards[currentIndex]?.front}
                                </h4>
                                <div className="mt-8 flex items-center gap-2 text-[8px] font-black uppercase text-text-muted opacity-40">
                                    <Sparkles size={10} />
                                    Tap to flip
                                </div>
                            </div>

                            {/* Back Side */}
                            <div 
                                className="absolute inset-0 backface-hidden bg-emerald-500 rounded-[32px] p-8 flex flex-col items-center justify-center text-center text-white shadow-xl rotate-y-180"
                            >
                                <h4 className="text-base font-bold leading-relaxed italic">
                                    "{cards[currentIndex]?.back}"
                                </h4>
                                <div className="mt-6 w-12 h-1 bg-white/30 rounded-full" />
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex items-center justify-center gap-8 py-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); prevCard(); }}
                            className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-text-muted hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); nextCard(); }}
                            className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-text-muted hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-10 text-center bg-white dark:bg-zinc-900 rounded-[32px] border border-line dark:border-white/5 space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No deck active. Target chapters needed.</p>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
