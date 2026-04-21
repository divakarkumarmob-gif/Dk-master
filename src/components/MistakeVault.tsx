import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  Brain, 
  Sparkles, 
  ChevronRight, 
  Flame, 
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAppStore, Question } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';

export const MistakeVault: React.FC = () => {
  const { mistakeVault, removeFromMistakeVault, theme } = useAppStore();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);

  const getAiTip = async (q: Question) => {
    setLoadingTip(true);
    setAiTip(null);
    try {
      const prompt = `Student made a mistake in this NEET question: "${q.text}". Correct answer is "${q.options[q.correctAnswer]}". Give a very short, conceptual "Pro-Tip" to never make this mistake again. Max 2 lines.`;
      const tip = await geminiService.solveDoubt(prompt);
      setAiTip(tip);
    } catch (e) {
      console.error(e);
      setAiTip("Error generating tip. Focus on NCERT basis.");
    }
    setLoadingTip(false);
  };

  if (mistakeVault.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 opacity-40">
        <div className="w-20 h-20 bg-[#E8E8E1] dark:bg-zinc-800 rounded-3xl flex items-center justify-center">
          <CheckCircle2 size={40} className="text-olive-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black uppercase tracking-tight text-olive-dark dark:text-white">Vault Empty</h3>
          <p className="text-xs font-bold text-text-muted px-4 italic">No mistakes detected. You are operating at peak architecture precision!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-xl shadow-red-500/10 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <Flame size={20} className="text-yellow-300" />
                    Galti Sudhar Zone
                </h3>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter italic">Transform your weaknesses into elite strengths</p>
            </div>
            <div className="text-right">
                <span className="text-3xl font-black">{mistakeVault.length}</span>
                <p className="text-[8px] font-bold uppercase opacity-60">Mistakes</p>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
      </div>

      <div className="grid gap-4">
        {mistakeVault.map((q) => (
          <motion.div
            key={q.id}
            whileHover={{ scale: 1.01 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-line dark:border-white/5 shadow-sm overflow-hidden"
          >
            <div className="p-4 flex gap-4">
               <div className={cn(
                 "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black text-[10px] uppercase",
                 q.subject === 'Physics' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                 q.subject === 'Chemistry' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                 "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
               )}>
                 {q.subject?.charAt(0) || 'B'}
               </div>
               <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-[9px] font-black uppercase text-text-muted dark:text-zinc-500 tracking-widest">{q.subject} • {q.chapter}</p>
                    <button 
                      onClick={() => removeFromMistakeVault(q.id)}
                      className="text-text-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-text-main dark:text-white line-clamp-2 leading-relaxed">{q.text}</p>
                  <button 
                    onClick={() => {
                        setSelectedQuestion(q);
                        getAiTip(q);
                    }}
                    className="flex items-center gap-2 text-[10px] font-black text-orange-accent uppercase tracking-widest pt-2 hover:opacity-70 transition-all"
                  >
                    <Sparkles size={12} />
                    Refine Concept
                    <ChevronRight size={10} />
                  </button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedQuestion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-line dark:border-white/5 flex justify-between items-center bg-orange-accent/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-accent rounded-xl flex items-center justify-center text-white">
                            <Brain size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-olive-dark dark:text-white">Refinement Logic</h4>
                            <p className="text-[9px] text-orange-accent font-bold uppercase tracking-widest">Mistake Correction</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedQuestion(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} className="text-text-muted" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="space-y-2">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60">The Challenge</h5>
                        <p className="text-base font-bold text-text-main dark:text-white leading-relaxed font-display">{selectedQuestion.text}</p>
                    </div>

                    <div className="bg-[#F8F8F4] dark:bg-white/5 p-4 rounded-2xl border border-line dark:border-white/10">
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40] dark:text-zinc-500 mb-3 flex items-center gap-2">
                            <AlertCircle size={12} className="text-orange-accent" />
                            Correct Reality
                         </h5>
                         <p className="text-sm font-black text-green-600 dark:text-green-400">{selectedQuestion.options[selectedQuestion.correctAnswer]}</p>
                    </div>

                    <div className="bg-olive-primary/5 p-5 rounded-2xl border border-olive-primary/20 space-y-3 relative overflow-hidden">
                        <div className="flex items-center gap-2 relative z-10">
                            <Sparkles size={16} className="text-orange-accent animate-pulse" />
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-olive-primary dark:text-white">AI Neural Insight</h5>
                        </div>
                        
                        {loadingTip ? (
                             <div className="flex items-center gap-3 py-4">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-orange-accent border-t-transparent rounded-full"
                                />
                                <p className="text-[11px] font-black uppercase text-text-muted italic">Synthesizing correction algorithm...</p>
                             </div>
                        ) : (
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs font-serif font-medium leading-relaxed italic text-olive-dark dark:text-zinc-300 relative z-10"
                            >
                                "{aiTip || selectedQuestion.explanation}"
                            </motion.p>
                        )}
                        <Lightbulb size={64} className="absolute -bottom-4 -right-4 text-olive-primary/5 -rotate-12" />
                    </div>

                    <div className="pt-4">
                         <button 
                            onClick={() => {
                                removeFromMistakeVault(selectedQuestion.id);
                                setSelectedQuestion(null);
                            }}
                            className="w-full py-4 bg-olive-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-olive-primary/20 active:scale-[0.98] transition-transform"
                         >
                            Understood & Mastered
                         </button>
                    </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
