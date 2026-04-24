import React from 'react';
import { motion } from 'motion/react';
import { Box, Scan, Layers, Sparkles } from 'lucide-react';

export const VisualDecoder: React.FC = () => {
    return (
        <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                        <Box size={24} className="text-orange-accent" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight">Visual Decoder</h3>
                    <p className="text-[10px] opacity-60 uppercase font-black tracking-widest">3D Interaction core</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-orange-accent/20 rounded-xl flex items-center justify-center text-orange-accent group-hover:bg-orange-accent group-hover:text-white transition-colors">
                        <Scan size={20} />
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed">Upload a diagram to initiate neural decomposition and labels.</p>
                </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                <Layers size={120} />
            </div>
        </div>
    );
};
