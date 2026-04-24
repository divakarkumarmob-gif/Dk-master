import React from 'react';
import { motion } from 'motion/react';
import { Brain, MessageSquare, Sparkles } from 'lucide-react';

export const ConceptBot: React.FC = () => {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border-2 border-slate-100 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                    <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-black dark:text-white leading-none">Concept Bot</h3>
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-500">v1.2 Online</span>
                </div>
            </div>
            <div className="bg-slate-100 dark:bg-zinc-800 p-4 rounded-2xl">
                 <p className="text-[12px] text-black dark:text-white font-medium leading-relaxed italic opacity-80">"How can I help you visualize complex biology concepts today? Type a topic to decompose into neural nodes."</p>
            </div>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Enter concept (e.g. Krebs Cycle)"
                    className="w-full p-4 pr-12 bg-white dark:bg-zinc-800 border-2 border-slate-100 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-400 font-bold text-sm transition-all shadow-sm dark:text-white"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg transform active:scale-90">
                    <Brain size={16} />
                </button>
            </div>
        </div>
    );
};
