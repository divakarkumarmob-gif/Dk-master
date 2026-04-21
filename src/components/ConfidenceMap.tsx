import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Activity, 
  Zap, 
  Target, 
  AlertCircle,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

export const ConfidenceMap: React.FC = () => {
  const { results, mistakeVault } = useAppStore();

  // Aggregate knowledge health across subjects
  const subjects = ['Physics', 'Chemistry', 'Biology'];
  
  const stats = subjects.map(subject => {
    const subResults = results.filter(r => r.subject === subject);
    const totalQ = subResults.reduce((acc, r) => acc + r.totalQuestions, 0);
    const totalCorrect = subResults.reduce((acc, r) => acc + r.correct, 0);
    
    // Readiness Score: Weighted average of correct % and penalty for mistakes in vault
    const baseScore = totalQ > 0 ? (totalCorrect / totalQ) * 100 : 0;
    const mistakesCount = mistakeVault.filter(q => q.subject === subject).length;
    
    // Penalty is logarithmic to avoid dropping to 0 too fast
    const penalty = Math.min(baseScore * 0.5, Math.log10(mistakesCount + 1) * 15);
    const readiness = Math.max(0, Math.floor(baseScore - (subResults.length > 0 ? penalty : 0)));
    
    return {
      subject,
      readiness,
      mistakes: mistakesCount,
      tests: subResults.length
    };
  });

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/20 border-emerald-500/30';
    if (score >= 50) return 'text-orange-500 bg-orange-500/20 border-orange-500/30';
    return 'text-rose-500 bg-rose-500/20 border-rose-500/30';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center border border-orange-500/30">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Confidence Map</h3>
            <p className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter opacity-60">Readiness AI Predictor</p>
          </div>
        </div>
        <TrendingUp size={16} className="text-zinc-600" />
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-6 space-y-6">
        {results.length === 0 ? (
            <div className="py-8 text-center space-y-3">
                <BarChart3 size={32} className="mx-auto text-zinc-700" />
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">
                    Insufficient Data.<br/>Complete 1 test to generate AI Map.
                </p>
            </div>
        ) : (
            <div className="space-y-6">
                {stats.map((stat, i) => (
                    <div key={stat.subject} className="space-y-2">
                        <div className="flex justify-between items-end px-1">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">{stat.subject}</span>
                                <div className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold inline-block border", getHealthColor(stat.readiness))}>
                                    {stat.readiness}% READY
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase">Mistakes</p>
                                <p className="text-xs font-black text-white">{stat.mistakes}</p>
                            </div>
                        </div>
                        
                        {/* Progress Bar Container */}
                        <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${stat.readiness}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className={cn("h-full rounded-full shadow-inner shadow-black/20", getBarColor(stat.readiness))}
                            />
                        </div>
                    </div>
                ))}

                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Critical Weakness</p>
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={14} className="text-rose-500" />
                            <p className="text-[11px] font-bold text-white uppercase italic">
                                {stats.sort((a, b) => a.readiness - b.readiness)[0].subject}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Top Strength</p>
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-emerald-500" />
                            <p className="text-[11px] font-bold text-white uppercase italic">
                                {stats.sort((a, b) => b.readiness - a.readiness)[0].subject}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="px-2 flex items-center gap-2 opacity-40">
          <AlertCircle size={10} className="text-orange-500" />
          <p className="text-[8px] font-black uppercase tracking-widest text-white">Analyzed from {results.length} tests & {mistakeVault.length} errors</p>
      </div>
    </div>
  );
};
