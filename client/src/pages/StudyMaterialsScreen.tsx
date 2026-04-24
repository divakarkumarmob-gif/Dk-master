import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, FileText, ChevronRight, Share2, Plus, Filter, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const StudyMaterialsScreen: React.FC = () => {
    return (
        <div className="space-y-8 py-6">
             <header className="px-2 flex justify-between items-center">
                <h2 className="text-xl font-display font-black uppercase tracking-tight">Sync Library</h2>
                <div className="flex gap-2">
                    <button className="p-3 bg-white rounded-2xl shadow-sm border border-line"><Filter size={18} /></button>
                    <button className="p-3 bg-orange-accent text-white rounded-2xl shadow-lg shadow-orange-500/20"><Plus size={18} /></button>
                </div>
             </header>

             <div className="px-2 relative">
                <input 
                    type="search" 
                    placeholder="Search node archives..."
                    className="w-full p-4 pl-12 bg-white rounded-2xl border border-line focus:border-orange-accent outline-none font-bold shadow-sm"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
             </div>

             <div className="space-y-4 px-2">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 italic">Neural Sync Uploads</h4>
                 <div className="grid gap-4">
                     <LibraryItem title="Physics Part 1" category="NCERT" status="Synced" />
                     <LibraryItem title="Chemistry Notes" category="User" status="Local Only" />
                     <LibraryItem title="Biology Diagrams" category="AI Enhanced" status="Synced" />
                 </div>
             </div>
        </div>
    );
};

const LibraryItem = ({ title, category, status }: { title: string, category: string, status: string }) => (
    <div className="bg-white p-5 rounded-[28px] border border-line flex items-center justify-between shadow-sm group hover:border-orange-accent transition-all cursor-pointer">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-accent/10 group-hover:text-orange-accent transition-colors">
                <FileText size={24} />
            </div>
            <div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{category}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", status === 'Synced' ? 'text-green-500' : 'text-orange-accent')}>{status}</span>
                </div>
            </div>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-orange-accent transition-colors" />
    </div>
);

import { cn } from '../lib/utils';
export default StudyMaterialsScreen;
