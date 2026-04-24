import React from 'react';
import { motion } from 'motion/react';
import { Brain, MessageSquare, Sparkles } from 'lucide-react';

export const ActiveRecallBot: React.FC = () => {
    return (
        <div className="bg-slate-900 p-6 rounded-[32px] text-white space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Brain size={20} className="text-orange-accent" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-widest leading-none">Neural Recall Agent</h3>
             </div>
             <p className="text-[11px] opacity-60 italic leading-relaxed">Agent status: Monitoring neural retention. I will suggest active retrieval tasks based on your study pattern.</p>
             <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all">
                Sync Retention Map
             </button>
        </div>
    );
};
