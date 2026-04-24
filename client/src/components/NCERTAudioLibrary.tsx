import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Headphones, Play, FileText, ScrollText } from 'lucide-react';

export const NCERTAudioLibrary: React.FC = () => {
    return (
        <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audio Syllabus</h4>
                <button className="text-[9px] font-black uppercase tracking-widest text-orange-accent">View All</button>
             </div>
             <div className="grid gap-3">
                 <AudioItem title="Biological Classification" duration="14:20" />
                 <AudioItem title="Atomic Structure" duration="12:05" />
                 <AudioItem title="Laws of Motion" duration="18:30" />
             </div>
        </div>
    );
};

const AudioItem = ({ title, duration }: { title: string, duration: string }) => (
    <div className="bg-white p-4 rounded-2xl border border-line flex items-center justify-between group hover:border-orange-accent transition-all cursor-pointer">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 rounded-xl group-hover:bg-orange-accent/10 group-hover:text-orange-accent transition-colors underline-offset-4">
                <Play size={18} fill="currentColor" />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{duration} • NCERT Ch.1</p>
            </div>
        </div>
        <button><ScrollText size={18} className="text-slate-300" /></button>
    </div>
);
