import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Brain, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Zap,
  Timer,
  AlertCircle,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

export const ActiveRecallBot: React.FC = () => {
  const { mistakeVault } = useAppStore();
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const pickRandomMistake = () => {
    if (mistakeVault.length === 0) return;
    const randomIndex = Math.floor(Math.random() * mistakeVault.length);
    setCurrentQuestion(mistakeVault[randomIndex]);
    setShowAnswer(false);
    setFeedback(null);
  };

  useEffect(() => {
    if (!currentQuestion && mistakeVault.length >= 3) {
      pickRandomMistake();
    }
  }, [mistakeVault, currentQuestion]);

  if (mistakeVault.length < 3) {
    return (
      <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-6 opacity-50 grayscale">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center">
                <Brain size={18} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Active Recall Bot</h3>
        </div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
            Locked. Collect at least 3 mistakes in your vault to start Spaced Repetition.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
       {/* Header */}
       <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center border border-purple-500/30">
            <RefreshCcw size={18} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Active Recall</h3>
            <p className="text-[9px] font-bold text-purple-500 uppercase tracking-tighter opacity-60">Memory Nudge AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
            <Zap size={10} className="text-purple-400" />
            <span className="text-[10px] font-black text-purple-400 tracking-tighter">BOOST</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-purple-500/20 rounded-[32px] p-6 space-y-6 relative overflow-hidden group">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[50px] rounded-full group-hover:bg-purple-600/10 transition-colors"></div>

        <AnimatePresence mode="wait">
            {!currentQuestion ? (
                <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="py-10 text-center"
                >
                    <Loader2 className="animate-spin text-purple-500 mx-auto" size={32} />
                </motion.div>
            ) : (
                <motion.div 
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-lg uppercase tracking-widest border border-white/5">
                                {currentQuestion.subject}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-lg uppercase tracking-widest border border-purple-500/20 italic">
                                Recall Task
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-relaxed">
                            {currentQuestion.text}
                        </h4>
                    </div>

                    {!showAnswer ? (
                        <button 
                            onClick={() => setShowAnswer(true)}
                            className="w-full py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg active:scale-95"
                        >
                            Reveal Answer
                        </button>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-2">Answer</p>
                                <p className="text-sm font-black text-white">
                                    {currentQuestion.options[currentQuestion.correctAnswer]}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => { setFeedback('correct'); setTimeout(pickRandomMistake, 1000); }}
                                    className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    <CheckCircle2 size={16} /> Remembered
                                </button>
                                <button 
                                    onClick={() => { setFeedback('wrong'); setTimeout(pickRandomMistake, 1000); }}
                                    className="flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                    <XCircle size={16} /> Forgot
                                </button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
            <Timer size={12} />
            <span>Spaced Repetition Active</span>
        </div>
        <button 
            onClick={pickRandomMistake}
            className="text-[9px] font-black text-purple-400 uppercase tracking-widest hover:underline"
        >
            Skip Challenge
        </button>
      </div>
    </div>
  );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
    <RefreshCcw className={cn("animate-spin", className)} size={size} />
);
