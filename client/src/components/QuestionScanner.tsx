import React from 'react';
import { motion } from 'motion/react';
import { Scan, Image as ImageIcon, Camera, Sparkles } from 'lucide-react';

export const QuestionScanner: React.FC = () => {
    return (
        <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                        <Scan size={24} className="text-orange-accent" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-orange-accent bg-orange-accent/10 px-2 py-1 rounded-md animate-pulse">Neural Active</span>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight">Question Scanner</h3>
                    <p className="text-[10px] opacity-40 uppercase font-black tracking-widest leading-relaxed">Neural OCR for multi-modal inquiry processing and instant cognitive response.</p>
                </div>

                <div className="flex gap-3">
                    <button className="flex-1 py-4 bg-orange-accent text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2">
                        <Camera size={14} />
                        Capture
                    </button>
                    <button className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                        <ImageIcon size={14} />
                        Identity
                    </button>
                </div>
            </div>
            {/* Animated Grid Decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>
    );
};
