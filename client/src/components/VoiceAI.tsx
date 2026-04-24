import React from 'react';
import { motion } from 'motion/react';
import { Mic, Zap, Brain, Sparkles } from 'lucide-react';

export const VoiceAI: React.FC = () => {
    return (
        <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                        <Mic size={24} className="text-orange-accent" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight">Voice AI Interface</h3>
                    <p className="text-[10px] opacity-40 uppercase font-black tracking-widest leading-relaxed">Neural Audio Processing Unit</p>
                </div>

                <div className="flex justify-center py-4">
                     <div className="w-20 h-20 bg-orange-accent rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,99,33,0.3)] animate-pulse">
                        <Mic size={32} />
                     </div>
                </div>

                <button className="w-full py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                    Initiate Voice Sync
                </button>
            </div>
        </div>
    );
};
