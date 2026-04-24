import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Upload, File as FileIcon, ChevronRight } from 'lucide-react';

export const AdminStudyMaterial: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-[32px] border border-line shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-accent/10 text-orange-accent rounded-2xl flex items-center justify-center">
                    <Upload size={20} />
                </div>
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Knowledge Upload</h3>
            </div>
            
            <div className="grid gap-4">
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-2 group hover:border-orange-accent transition-colors">
                    <FileIcon className="text-slate-300 group-hover:text-orange-accent" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drop PDF or Select Nodes</p>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Global Target Path</label>
                    <input type="text" placeholder="/library/physics/part1" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs" />
                </div>
            </div>

            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                Broadcast to Network
            </button>
        </div>
    );
};
