import React from 'react';
import { motion } from 'motion/react';
import { History, Flame, Star, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

export const MistakeVault: React.FC = () => {
    const { mistakeVault, theme } = useAppStore();

    return (
        <div className="space-y-6">
             <div className="flex bg-orange-accent p-6 rounded-[32px] text-white overflow-hidden relative shadow-xl shadow-orange-accent/20">
                <div className="relative z-10 space-y-2">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                        <Flame size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Mistake Vault</h2>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Neural Weakness Archives</p>
                    </div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                     <History size={120} />
                </div>
             </div>

             <div className="space-y-4">
                {mistakeVault.length > 0 ? (
                    mistakeVault.map((q, i) => (
                        <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-line dark:border-white/5 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vault Item-{i+1}</span>
                                <div className="p-1 px-2 bg-orange-accent/10 rounded-md">
                                    <span className="text-[9px] font-black uppercase text-orange-accent">Unresolved</span>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">{q.text}</p>
                            <div className="pt-2">
                                <button className="text-[9px] font-black uppercase tracking-widest text-orange-accent flex items-center gap-2">
                                    <BookOpen size={14} />
                                    Review Concept
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 opacity-30 italic font-black uppercase tracking-widest text-[10px] dark:text-white">
                        Vault is empty. No neural failures recorded.
                    </div>
                )}
             </div>
        </div>
    );
};
