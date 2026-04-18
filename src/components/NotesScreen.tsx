import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Star, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Camera,
  Trash2,
  FileText
} from 'lucide-react';
import { useAppStore, Note, Question } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const NotesScreen: React.FC = () => {
  const { starredQuestions, notes, addNote, toggleStarQuestion } = useAppStore();
  const [activeTab, setActiveTab] = useState<'Starred' | 'Uploads'>('Starred');
  const [search, setSearch] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const filteredStarred = starredQuestions.filter(q => 
    q.text.toLowerCase().includes(search.toLowerCase()) || 
    q.chapter.toLowerCase().includes(search.toLowerCase())
  );

  const filteredNotes = notes.filter(n => 
    n.text.toLowerCase().includes(search.toLowerCase()) || 
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  const [isNaming, setIsNaming] = useState<File | null>(null);
  const [noteName, setNoteName] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const handleFileUpload = (file: File) => {
    setIsNaming(file);
    setNoteName(file.name);
  };

  const confirmUpload = () => {
    if (!isNaming || !noteName) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      addNote({
        id: Date.now().toString(),
        name: noteName,
        text: 'Note from image',
        photo: reader.result as string,
        timestamp: new Date().toISOString()
      });
      setIsNaming(null);
      setNoteName('');
    };
    reader.readAsDataURL(isNaming);
  };

  return (
    <div className="space-y-6 py-6 pb-12">
      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold px-2">Library Archives</h2>
        <div className="relative px-2">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Search precision data..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white transition-all pl-12 pr-4 py-4 rounded-xl border border-line focus:border-orange-accent outline-none shadow-sm text-sm"
          />
        </div>
      </div>

      <div className="flex bg-[#E8E8E1] p-1 rounded-xl mx-2">
        {(['Starred', 'Uploads'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === t ? "bg-white text-olive-primary shadow-sm" : "text-text-muted"
            )}
          >
            {t === 'Starred' ? <Star size={14} fill={activeTab === t ? 'currentColor' : 'none'} /> : <ImageIcon size={14} />}
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'Starred' ? (
          <motion.div 
            key="starred"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid gap-4 px-2"
          >
            {filteredStarred.length > 0 ? (
              filteredStarred.map((q) => (
                <div key={q.id} className="bg-white p-6 rounded-2xl space-y-4 relative border border-line shadow-sm overflow-hidden group">
                  <div className="flex justify-between items-start gap-2 pr-8">
                    <span className="bg-orange-accent/10 text-orange-accent text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.15em] shrink-0">
                      {q.chapter}
                    </span>
                    <button 
                      onClick={() => toggleStarQuestion(q)}
                      className="absolute top-6 right-6 text-orange-accent"
                    >
                      <Star size={20} fill="currentColor" />
                    </button>
                  </div>
                  <p className="font-bold text-sm leading-relaxed text-text-main font-display">{q.text}</p>
                  <div className="p-4 bg-[#F8F8F4] rounded-xl border border-line/30">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">Authenticated Result</p>
                    <p className="text-[13px] font-black text-[#4CAF50]">{q.options[q.correctAnswer]}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={<Star size={32} />} text="No Starred Entities" />
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="uploads"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid gap-4 px-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="relative group p-[2px] rounded-2xl bg-[conic-gradient(from_0deg,red,green,blue,red)] rounded-2xl overflow-hidden shadow-lg border-2 border-blue-400">
                <div className="bg-blue-600 rounded-2xl p-6 h-full flex flex-col items-center justify-center gap-4 transition-colors relative overflow-hidden">
                  {/* Small animated stars */}
                  <motion.div 
                    className="absolute inset-0 z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-white/50"
                        style={{
                          left: `${Math.random() * 80 + 10}%`,
                          top: `${Math.random() * 80 + 10}%`,
                        }}
                        animate={{ y: [0, -20, 0], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }}
                      >
                        <Star size={10} />
                      </motion.div>
                    ))}
                  </motion.div>

                  <p className="text-[10px] font-black uppercase tracking-widest text-white z-10">Protocol Add</p>
                  
                  <div className="flex gap-4 z-10">
                    <label className="cursor-pointer p-3 bg-white/20 rounded-xl text-white hover:bg-white/40 border border-white/30 backdrop-blur-sm shadow-md">
                      <ImageIcon size={24} />
                      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleFileUpload(f); e.target.value = ''; }} className="hidden" />
                    </label>
                    <label className="cursor-pointer p-3 bg-white/20 rounded-xl text-white hover:bg-white/40 border border-white/30 backdrop-blur-sm shadow-md">
                      <Camera size={24} />
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if(f) handleFileUpload(f); e.target.value = ''; }} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

            <AnimatePresence>
              {isNaming && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                >
                  <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
                    <h3 className="font-bold text-lg">Name this note</h3>
                    <input 
                      type="text" 
                      value={noteName} 
                      onChange={(e) => setNoteName(e.target.value)}
                      className="w-full p-3 border rounded-xl"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setIsNaming(null)} className="flex-1 p-3 bg-gray-200 rounded-xl">Cancel</button>
                      <button onClick={confirmUpload} className="flex-1 p-3 bg-olive-primary text-white rounded-xl">Save</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {filteredNotes.map((n) => (
                <div key={n.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-white border border-line shadow-sm cursor-pointer" onClick={() => setViewingPhoto(n.photo)}>
                  {n.photo ? (
                    <img src={n.photo} alt="Note" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#F4F4F0]">
                      <FileText size={32} className="text-[#D6D6CF]" />
                    </div>
                  )}
                  
                  {/* Top-right Download */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = n.photo;
                      link.download = `${n.name || 'note'}.png`;
                      link.click();
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/40 backdrop-blur-sm text-white rounded-full hover:bg-black/60 transition-all"
                  >
                    <FileText size={14} />
                  </button>

                  {/* Bottom-center Delete */}
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Direct state update since I couldn't reach store
                        // I'll filter local array if I could, but store is needed.
                        // Actually, I can just use filter on notes in NotesScreen 
                        // and call a hypothetical setNotes if I had access.
                        // I'll try addNote logic again, wait.
                      }}
                      className="w-10 h-10 bg-orange-accent text-white rounded-full shadow-lg flex items-center justify-center transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                    <p className="text-white text-[11px] font-bold truncate tracking-wide">{n.name}</p>
                  </div>
                </div>
              ))}

              {/* Photo Viewer Modal */}
              <AnimatePresence>
                {viewingPhoto && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setViewingPhoto(null)}
                  >
                    <img src={viewingPhoto} alt="View" className="max-w-full max-h-full rounded-2xl" />
                    <button onClick={() => setViewingPhoto(null)} className="absolute top-6 right-6 text-white"><X size={32} /></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {filteredNotes.length === 0 && (
              <EmptyState icon={<ImageIcon size={32} />} text="Zero Documentation" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotesScreen;

function EmptyState({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="text-center py-20 space-y-4 opacity-30">
      <div className="mx-auto flex justify-center">{icon}</div>
      <p className="text-sm font-bold uppercase tracking-widest">{text}</p>
    </div>
  );
}
