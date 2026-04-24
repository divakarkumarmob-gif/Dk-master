import React from 'react';
import { motion } from 'motion/react';
import { Zap, Timer, Flame, Target } from 'lucide-react';

export const RapidFireQuiz: React.FC = () => {
    return (
        <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-orange-accent rounded-2xl flex items-center justify-center shadow-lg">
                        <Timer size={24} />
                    </div>
                    <div className="text-right">
                        <span className="block text-[10px] font-black uppercase text-orange-accent tracking-widest">Active Challenge</span>
                        <span className="text-sm font-black uppercase tracking-tight">Rapid Response v1</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-tight leading-tight">60 Seconds. 10 Questions.<br/>Neural Overload.</h3>
                    <p className="text-[10px] opacity-40 font-black uppercase tracking-widest leading-relaxed">System benchmark for speed and precision under high-intensity scenarios.</p>
                </div>

                <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                    Initiate Rapid Routine
                </button>
            </div>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-accent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-accent/20 transition-all" />
        </div>
    );
};
