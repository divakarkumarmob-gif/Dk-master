import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CalendarDays, 
  CheckCircle2, 
  Circle, 
  Zap, 
  Brain,
  ChevronRight,
  TrendingUp,
  LayoutList
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/gemini';

export const PlannerBot: React.FC = () => {
  const { results, streak } = useAppStore();
  const [tasks, setTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlanner = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `planner_${today}_${results.length}`; // Key depends on today's date and performance count
      
      const perfSummary = results.slice(-5).map(r => `${r.subject} (${r.score}/${r.totalQuestions * 4})`).join(', ');
      const prompt = `Act as a top NEET mentor. Based on my last 5 tests: ${perfSummary || 'No data yet'}. Give me exactly 3 short bullet points for today's focus. 3 lines only.`;
      
      const response = await geminiService.solveDoubt(prompt, undefined, undefined, cacheKey);
      if (response) {
          setTasks(response.split('\n').filter(t => t.trim().length > 5).slice(0, 3));
      }
    } catch (e) {
      console.error(e);
      setTasks(["Review NCERT Bio Diagrams", "Practice 10 High-Yield Phys Numericals", "Solve Mistake Vault Questions"]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Check local cache on mount, but do NOT call API automatically
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `planner_${today}_${results.length}`;
    const stored = localStorage.getItem(`gemini_cache_${cacheKey}`);
    if (stored) {
        try {
            const { data } = JSON.parse(stored);
            setTasks(data.split('\n').filter((t: string) => t.trim().length > 5).slice(0, 3));
        } catch(e) {}
    } else if (results.length === 0) {
        setTasks(["Select a chapter to start", "Deep dive into Biology NCERT", "Review Physics formulas"]);
    }
  }, [results.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
            <LayoutList size={18} className="text-orange-accent" />
            <h3 className="text-xs font-black uppercase tracking-widest text-olive-dark dark:text-white">AI Strategy List</h3>
        </div>
        <button 
          onClick={fetchPlanner}
          disabled={loading}
          className="text-[9px] font-black bg-orange-accent/10 text-orange-accent px-3 py-1 rounded-full uppercase hover:bg-orange-accent/20 transition-all flex items-center gap-1.5"
        >
          {loading ? 'Thinking...' : 'Sync Plan'}
        </button>
      </div>

      <div className="bg-white/50 dark:bg-zinc-900/60 border border-line dark:border-white/5 rounded-[32px] p-5 space-y-4 shadow-sm backdrop-blur-sm">
        {loading ? (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                        <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full shrink-0"></div>
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full"></div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="space-y-4">
                {tasks.map((task, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex gap-3 group"
                    >
                        <div className="mt-0.5 shrink-0">
                             <Circle size={14} className="text-orange-accent opacity-30 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[13px] font-bold text-olive-dark dark:text-zinc-300 leading-tight">
                            {task.replace(/^[•\-\d.\s]+/, '')}
                        </p>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-2 opacity-40">
          <TrendingUp size={12} className="text-orange-accent" />
          <p className="text-[8px] font-black uppercase tracking-widest text-olive-primary dark:text-white">Generated based on analysis</p>
      </div>
    </div>
  );
};
