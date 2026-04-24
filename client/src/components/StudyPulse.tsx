import React from 'react';
import { motion } from 'motion/react';
import { Target, Zap, Trophy } from 'lucide-react';

export const StudyPulse: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[32px] text-white space-y-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
          <Zap size={20} />
        </div>
        <h3 className="font-black text-sm uppercase tracking-widest">Neural Pulse</h3>
      </div>
      <p className="text-[11px] opacity-80 font-medium">Your current learning frequency is optimal. Synchronization level: 94%.</p>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "94%" }}
          className="h-full bg-white"
        />
      </div>
    </div>
  );
};
