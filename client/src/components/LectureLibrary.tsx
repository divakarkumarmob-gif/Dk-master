import React from 'react';
import { motion } from 'motion/react';
import { Play, Search, Video, List } from 'lucide-react';

export const LectureLibrary: React.FC = () => {
    return (
        <div className="space-y-4">
             <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-line dark:border-white/10 shadow-sm space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center">
                        <Video size={20} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-black dark:text-white">Lecture Archive</h3>
                 </div>
                 
                 <div className="relative">
                    <input 
                        type="search" 
                        placeholder="Search curated lectures..."
                        className="w-full p-4 pl-12 bg-slate-50 dark:bg-zinc-800 rounded-2xl outline-none focus:bg-white dark:focus:bg-black border-2 border-transparent focus:border-red-400 font-bold transition-all dark:text-white"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 </div>
                 
                 <div className="grid gap-2">
                     <LectureCard title="GOC - One Shot" channel="Study Mastery" />
                     <LectureCard title="Human Physiology" channel="Neural Academy" />
                 </div>
             </div>
        </div>
    );
};

const LectureCard = ({ title, channel }: { title: string, channel: string }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl group hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm transition-colors group-hover:bg-red-600 dark:group-hover:bg-red-500 group-hover:text-white">
                <Play size={14} fill="currentColor" />
            </div>
            <div>
                <p className="text-xs font-bold text-black dark:text-white">{title}</p>
                <p className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest">{channel}</p>
            </div>
        </div>
        <button className="text-slate-400 group-hover:text-red-400"><List size={16}/></button>
    </div>
);
