import React from 'react';
import { motion } from 'motion/react';
import { Target, Trophy, TrendingUp, Sparkles } from 'lucide-react';

export const RankPredictor: React.FC = () => {
    return (
        <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                        <Target size={24} className="text-orange-accent" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight">Neural Rank Predictor</h3>
                    <p className="text-[10px] opacity-60 uppercase font-black tracking-widest leading-relaxed">Cognitive estimation based on operational archives.</p>
                </div>

                <div className="flex items-end gap-2">
                    <span className="text-4xl font-black italic tracking-tighter">#2,450</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2 flex items-center gap-1">
                        <TrendingUp size={10} /> +120
                    </span>
                </div>

                <p className="text-[9px] opacity-40 font-black uppercase tracking-widest italic">Synchronization Confidence: 88%</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-accent/5 to-transparent pointer-none" />
        </div>
    );
};
