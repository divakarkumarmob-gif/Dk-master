import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Zap, RefreshCw } from 'lucide-react';

export const SmartFlashcards: React.FC = () => {
    return (
        <div className="space-y-4">
             <div className="bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-white/5 p-8 rounded-[32px] min-h-[220px] flex flex-col items-center justify-center text-center space-y-4 shadow-sm relative group cursor-pointer overflow-hidden">
                 <div className="w-12 h-12 bg-orange-accent/10 rounded-2xl flex items-center justify-center text-orange-accent group-hover:scale-110 transition-transform">
                    <Sparkles size={24} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Neural Flashcard</h4>
                    <p className="text-base font-bold text-slate-800 dark:text-white leading-relaxed">What is the primary function of Mitochondria in eukaryotic cells?</p>
                 </div>
                 <div className="absolute top-0 right-0 p-4">
                    <RefreshCw size={18} className="text-slate-200" />
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-50 dark:bg-black/20">
                    <motion.div animate={{ width: ['0%', '100%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} className="h-full bg-orange-accent" />
                 </div>
             </div>
        </div>
    );
};
