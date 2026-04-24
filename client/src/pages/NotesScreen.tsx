import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, FileText, ChevronRight, Edit3, Trash2, Calendar, Search, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const NotesScreen: React.FC = () => {
    const { notes } = useAppStore();

    return (
        <div className="space-y-8 py-6">
             <header className="px-2 flex justify-between items-center">
                <h2 className="text-xl font-display font-black uppercase tracking-tight">Personal Archives</h2>
                <div className="flex gap-2">
                    <button className="p-3 bg-white rounded-2xl shadow-sm border border-line"><Search size={18} /></button>
                    <button className="p-3 bg-orange-accent text-white rounded-2xl shadow-lg shadow-orange-500/20"><Plus size={18} /></button>
                </div>
             </header>

             <div className="space-y-4 px-2">
                 {notes.length > 0 ? (
                    notes.map((note, i) => (
                        <div key={note.id} className="bg-white p-6 rounded-[32px] border border-line shadow-sm space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{note.timestamp}</span>
                                <div className="flex gap-2">
                                    <button className="p-2 text-slate-300 hover:text-slate-800"><Edit3 size={16}/></button>
                                    <button className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                             </div>
                             <h3 className="text-lg font-black text-slate-800">{note.title}</h3>
                             <p className="text-sm text-slate-500 font-medium leading-relaxed">{note.content}</p>
                        </div>
                    ))
                 ) : (
                    <div className="text-center py-20 bg-white rounded-[32px] border border-line mt-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                            <FileText size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archives are empty</p>
                    </div>
                 )}
             </div>
        </div>
    );
};

export default NotesScreen;
