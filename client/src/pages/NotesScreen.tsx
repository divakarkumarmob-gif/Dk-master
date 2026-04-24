import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, FileText, ChevronRight, Edit3, Trash2, Calendar, Search, Plus, X, Save } from 'lucide-react';
import { useAppStore, Note } from '../store/useAppStore';
import { cn } from '../lib/utils';

const NotesScreen: React.FC = () => {
    const { notes, setFullState, showToast } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);
    const [currentNote, setCurrentNote] = useState<Partial<Note> | null>(null);

    const handleSave = () => {
        if (!currentNote?.title || !currentNote?.content) {
            showToast("Title and content are required", "error");
            return;
        }

        const newNotes = [...notes];
        if (currentNote.id) {
            const index = newNotes.findIndex(n => n.id === currentNote.id);
            newNotes[index] = { ...currentNote, timestamp: new Date().toLocaleDateString() } as Note;
        } else {
            newNotes.unshift({
                ...currentNote,
                id: Date.now().toString(),
                timestamp: new Date().toLocaleDateString()
            } as Note);
        }

        setFullState({ notes: newNotes });
        setIsEditing(false);
        setCurrentNote(null);
        showToast("Note saved successfully", "success");
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newNotes = notes.filter(n => n.id !== id);
        setFullState({ notes: newNotes });
        showToast("Note deleted", "info");
    };

    return (
        <div className="space-y-8 py-6">
             <header className="px-3 py-4 flex justify-between items-center">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-accent">Personalized</p>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Knowledge Base</h2>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setIsEditing(true); setCurrentNote({}); }}
                        className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-all"
                    >
                        <Plus size={22} />
                    </button>
                </div>
             </header>

             <div className="space-y-4 px-2 pb-12">
                 {notes.length > 0 ? (
                    notes.map((note) => (
                        <motion.div 
                            key={note.id} 
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => { setCurrentNote(note); setIsEditing(true); }}
                            className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-line dark:border-white/5 shadow-sm space-y-4 cursor-pointer hover:border-orange-accent transition-colors group"
                        >
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{note.timestamp}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <Edit3 size={16}/>
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(note.id, e)}
                                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                             </div>
                             <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tight line-clamp-2">{note.title}</h3>
                             <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-3">{note.content}</p>
                        </motion.div>
                    ))
                 ) : (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900/50 rounded-[32px] border border-line dark:border-white/5 mt-4">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mx-auto mb-4">
                            <FileText size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Archives are empty</p>
                    </div>
                 )}
             </div>

             {/* Editor Modal */}
             <AnimatePresence>
                {isEditing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-line dark:border-white/5 flex justify-between items-center">
                                <h3 className="font-black uppercase tracking-tight dark:text-white">Note Editor</h3>
                                <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Title Entry</label>
                                    <input 
                                        type="text"
                                        value={currentNote?.title || ""}
                                        onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                                        placeholder="Note Title..."
                                        className="w-full bg-slate-50 dark:bg-zinc-800 p-4 rounded-2xl outline-none font-black text-slate-800 dark:text-white border border-transparent focus:border-orange-accent transition-all"
                                    />
                                </div>
                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Neural Data</label>
                                    <textarea 
                                        value={currentNote?.content || ""}
                                        onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                                        placeholder="Start typing..."
                                        className="w-full bg-slate-50 dark:bg-zinc-800 p-4 rounded-2xl outline-none font-medium text-slate-600 dark:text-slate-300 min-h-[200px] border border-transparent focus:border-orange-accent transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="p-6 pt-0">
                                <button 
                                    onClick={handleSave}
                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                                >
                                    <Save size={16} />
                                    Save to Archives
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
             </AnimatePresence>
        </div>
    );
};

export default NotesScreen;
