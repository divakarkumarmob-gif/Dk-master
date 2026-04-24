import React from 'react';
import { motion } from 'motion/react';
import { Database, Play, Clock, Star } from 'lucide-react';

export const VideoVault: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-line shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                        <Database size={20} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Neural Video Vault</h3>
                </div>
            </div>

            <div className="grid gap-4">
                 <VideoCard title="Atomic Models" duration="24m" tags={['Chemistry']} />
                 <VideoCard title="Cell Cycle" duration="18m" tags={['Biology']} />
            </div>
        </div>
    );
};

const VideoCard = ({ title, duration, tags }: { title: string, duration: string, tags: string[] }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-red-400 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center text-white">
                 <Play size={18} fill="currentColor" className="relative z-10 transition-transform group-hover:scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-transparent opacity-40" />
             </div>
             <div>
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{duration}</span>
                    {tags.map(t => (
                        <span key={t} className="text-[9px] font-black uppercase tracking-widest text-orange-accent bg-orange-accent/10 px-1.5 py-0.5 rounded-md">{t}</span>
                    ))}
                </div>
             </div>
        </div>
        <button><Star size={16} className="text-slate-300" /></button>
    </div>
);
