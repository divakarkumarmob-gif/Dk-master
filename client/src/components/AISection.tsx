import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, ScanLine, Zap } from 'lucide-react';

export const AISection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col pt-12">
            <header className="flex items-center justify-between mb-12">
                <button onClick={onBack} className="text-white/60 font-black uppercase text-[10px] tracking-widest">Back to Terminal</button>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Neural Sync: active</span>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center space-y-10">
                <div className="relative">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-48 h-48 rounded-full border-2 border-white/5 flex items-center justify-center"
                    >
                         <div className="w-40 h-40 rounded-full border-2 border-orange-accent/20 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border-2 border-orange-accent/50" />
                         </div>
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="w-24 h-24 bg-orange-accent rounded-[40px] flex items-center justify-center shadow-[0_0_80px_rgba(255,99,33,0.4)]"
                        >
                            <Brain size={48} className="text-white" />
                        </motion.div>
                    </div>
                </div>

                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black uppercase tracking-tight">Neural Doubt Solver</h2>
                    <p className="text-sm opacity-60 font-medium max-w-xs mx-auto italic">Initializing advanced cognitive resolution engine. Upload visual data or query the network directly.</p>
                </div>

                <div className="w-full grid grid-cols-2 gap-4">
                     <ActionButton icon={<ScanLine />} label="Visual Scan" />
                     <ActionButton icon={<Zap />} label="Direct Query" />
                </div>
            </div>
        </div>
    );
};

const ActionButton = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <button className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-[32px] border border-white/10 hover:bg-white/10 transition-all group">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:text-orange-accent transition-colors">
            {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
    </button>
);
