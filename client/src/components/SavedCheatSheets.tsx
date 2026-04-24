import React from 'react';
import { motion } from 'motion/react';
import { Bookmark, FileText, ChevronRight, Share2 } from 'lucide-react';

export const SavedCheatSheets: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-line shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Bookmark size={20} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Cheat Sheets</h3>
                </div>
            </div>

            <div className="grid gap-4">
                 <CheatSheetCard title="Formula Master List" subject="Physics" pages={4} />
                 <CheatSheetCard title="Plant Morphology" subject="Biology" pages={2} />
            </div>
        </div>
    );
};

const CheatSheetCard = ({ title, subject, pages }: { title: string, subject: string, pages: number }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-400 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <FileText size={20} />
            </div>
            <div>
                 <p className="text-sm font-bold text-slate-800">{title}</p>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{subject} • {pages} Pages</p>
            </div>
        </div>
        <button><Share2 size={16} className="text-slate-300 hover:text-indigo-600 transition-colors" /></button>
    </div>
);
