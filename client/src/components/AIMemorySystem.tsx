import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Database, Shield } from 'lucide-react';

export const AIMemorySystem: React.FC = () => {
    return (
        <div className="bg-slate-900 min-h-[400px] rounded-[32px] p-8 text-white space-y-8 relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 bg-blue-500 rounded-[24px] flex items-center justify-center shadow-lg">
                    <Database size={32} />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tight">AI Memory Core</h2>
                   <p className="text-sm opacity-60 font-medium italic">Advanced synchronization protocol for academic retention.</p>
                </div>

                <div className="grid gap-4 pt-4">
                    <MemoryStat label="Neural Nodes" value="1,240" />
                    <MemoryStat label="Retention Strength" value="98.2%" />
                    <MemoryStat label="Cache Lifecycle" value="7 Days" />
                </div>
             </div>
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
    );
};

const MemoryStat = ({ label, value }: { label: string, value: string }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
        <span className="text-[10px] uppercase font-black tracking-widest opacity-40">{label}</span>
        <span className="font-bold text-sm tracking-tight">{value}</span>
    </div>
);
