import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Target, 
  MapPin, 
  AlertTriangle, 
  Sparkles, 
  Loader2,
  ChevronDown,
  Award,
  BarChart2
} from 'lucide-react';
import { useAppStore, TestResult } from '../store/useAppStore';
import { geminiService } from '../services/gemini';
import { cn } from '../lib/utils';

interface RankData {
    air: string;
    stateRank: string;
    percentile: string;
    weakness: string;
    suggestion: string;
}

export const RankPredictor: React.FC = () => {
  const { results } = useAppStore();
  const [data, setData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const predictRank = async () => {
    if (results.length === 0) return;
    setLoading(true);
    try {
      const perfSummary = results.map(r => `${r.type} ${r.subject || 'Mock'}: ${r.score}/720 (Correct: ${r.correct})`).join(' | ');
      const prompt = `Act as a senior NEET data scientist. Based on these test results: [${perfSummary}], predict the student's Probable All India Rank (AIR), State Rank (assuming a high-competition state like UP/Rajasthan), and overall Percentile. Identify the biggest weakness dragging the rank down.
      Format your response strictly as a JSON object: { "air": "range", "stateRank": "range", "percentile": "value%", "weakness": "subject/topic", "suggestion": "one concise tip" }.
      No extra text. If data is low, return an optimistic but realistic baseline.`;
      
      const response = await geminiService.solveDoubt(prompt);
      if (response) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            setData(JSON.parse(jsonMatch[0]));
        }
      }
    } catch (e) {
        console.error("Rank prediction failed:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (results.length >= 3 && !data) {
        predictRank();
    }
  }, [results]);

  if (results.length < 1) return null;

  return (
    <div className="space-y-4">
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 p-6 rounded-[32px] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden cursor-pointer"
      >
        <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <Award size={20} className="text-blue-300" />
                    AI Rank Predictor
                </h3>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter italic">NEET Probable Trajectory Evaluation</p>
            </div>
            <div className="flex items-center gap-3">
                <TrendingUp size={24} className={cn("opacity-20 transition-transform duration-500", isOpen ? "scale-125 -rotate-12" : "")} />
                <ChevronDown size={18} className={cn("transition-transform duration-300", isOpen ? "rotate-180" : "")} />
            </div>
        </div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-4"
          >
            {loading ? (
                <div className="p-10 flex flex-col items-center gap-4 bg-white dark:bg-zinc-900 rounded-[32px] border border-line dark:border-white/5 shadow-sm">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Simulating Exam Nexus...</p>
                </div>
            ) : data ? (
                <div className="grid gap-4">
                    {/* Primary Ranks */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-line dark:border-white/5 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted dark:text-zinc-500 mb-1">All India Rank</p>
                                <p className="text-2xl font-black text-text-main dark:text-white">#{data.air}</p>
                            </div>
                            <Target size={40} className="absolute -bottom-4 -right-4 text-zinc-100 dark:text-zinc-800 rotate-12" />
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-line dark:border-white/5 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted dark:text-zinc-500 mb-1">State Rank Est.</p>
                                <p className="text-2xl font-black text-blue-600">#{data.stateRank}</p>
                            </div>
                            <MapPin size={40} className="absolute -bottom-4 -right-4 text-blue-50/50 dark:text-blue-900/10 rotate-45" />
                        </div>
                    </div>

                    {/* Percentile & Weakness */}
                    <div className="bg-zinc-950 p-6 rounded-[32px] text-white space-y-6 relative overflow-hidden">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Percentile Range</p>
                                <p className="text-3xl font-black text-emerald-400">{data.percentile}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                                <BarChart2 size={24} className="text-white opacity-80" />
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5 relative z-10">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-6 h-6 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center shrink-0">
                                    <AlertTriangle size={14} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Critical Weakness</p>
                                    <p className="text-xs font-bold">{data.weakness}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                                    <Sparkles size={14} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Refinement Strategy</p>
                                    <p className="text-xs font-medium opacity-80 italic italic-serif">{data.suggestion}</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                    </div>

                    <button 
                        onClick={predictRank}
                        className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-text-muted rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                        Re-Analyse Trends
                    </button>
                </div>
            ) : (
                <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-[32px] border border-line dark:border-white/5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Insufficient Test Data</p>
                    <p className="text-xs font-medium opacity-60">Attempt at least 3 tests to unlock AI rank prediction.</p>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
