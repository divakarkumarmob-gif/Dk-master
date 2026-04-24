import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Terminal, HelpCircle, Bug } from 'lucide-react';

export const ErrorFixTest: React.FC<{ onStartTest: (config: any) => void }> = ({ onStartTest }) => {
  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-[28px] border border-line dark:border-white/5 space-y-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-accent/10 rounded-2xl flex items-center justify-center text-orange-accent">
          <Bug size={20} />
        </div>
        <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-white">Neural Conflict Resolution</h3>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed italic">Convert your mistake history into an active reinforcement protocol. Target your specific logical weaknesses.</p>
      <button 
        onClick={() => onStartTest({ type: 'Minor', subject: 'Mistakes', id: 'error-test' })}
        className="w-full py-4 bg-orange-accent text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
      >
        Initialize Repair Run
      </button>
    </div>
  );
};
