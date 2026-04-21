import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Loader2, 
  RefreshCcw,
  History,
  BrainCircuit
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface ErrorFixTestProps {
  onStartTest: (config: { id: string; type: 'Minor' | 'Major'; subject?: string; chapter?: string; isErrorFix?: boolean }) => void;
}

export const ErrorFixTest: React.FC<ErrorFixTestProps> = ({ onStartTest }) => {
  const { mistakeVault } = useAppStore();
  const [loading, setLoading] = useState(false);

  // Analyze mistakes to provide a summary
  const mistakeCounts = mistakeVault.reduce((acc, q) => {
    acc[q.subject] = (acc[q.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mainWeakness = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0];

  const handleStart = () => {
    setLoading(true);
    // Simulate some "AI calibration"
    setTimeout(() => {
        onStartTest({
            id: 'error-fix-' + Date.now(),
            type: 'Minor',
            isErrorFix: true
        });
        setLoading(false);
    }, 1500);
  };

  if (mistakeVault.length < 5) return (
    <div className="p-6 bg-zinc-900 border border-white/5 rounded-[32px] opacity-60">
        <div className="flex items-center gap-3 mb-4">
            <History size={18} className="text-zinc-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Error-Fix Test</h3>
        </div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
            Locked: Collect 5+ mistakes in vault to calibrate AI Error-Fix.
        </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleStart}
        className="bg-gradient-to-br from-red-600 via-rose-700 to-rose-900 p-6 rounded-[32px] text-white shadow-xl shadow-rose-500/20 relative overflow-hidden cursor-pointer"
      >
        <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <BrainCircuit size={18} className="text-rose-200" />
                        AI Error-Fix Mock
                    </h3>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter italic">Calibrated on {mistakeVault.length} Galtiyan</p>
                </div>
                <Sparkles size={20} className="text-rose-300 opacity-50" />
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Primary Target</p>
                     <p className="text-xs font-bold">{mainWeakness ? mainWeakness[0] : 'All Subjects'}</p>
                </div>
                {loading ? (
                    <Loader2 size={24} className="animate-spin text-white" />
                ) : (
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                        <ChevronRight size={20} />
                    </div>
                )}
            </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <AlertCircle size={80} className="absolute -bottom-8 -left-8 text-black opacity-10 -rotate-12" />
      </motion.div>

      <div className="px-4 flex items-center gap-2 opacity-50">
          <RefreshCcw size={10} className="text-rose-400" />
          <p className="text-[8px] font-black uppercase tracking-widest text-white">Focuses on concepts you failed recently</p>
      </div>
    </div>
  );
};
