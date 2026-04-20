import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Star, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Camera,
  Trash2,
  FileText,
  Download,
  Maximize2,
  Sparkles,
  Loader2,
  Brain
} from 'lucide-react';
import { useAppStore, Note, Question } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { geminiService } from '../services/gemini';
import Markdown from 'react-markdown';

const NotesScreen: React.FC = () => {
  const { starredQuestions, notes, addNote, updateNote, deleteNote, toggleStarQuestion, setLastAnalyzedPhotoContext, setLastUploadedPhotoName, setPreloadedAIPhoto, setActiveTab: setGlobalTab } = useAppStore();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'Starred' | 'Uploads'>('Starred');
  const [search, setSearch] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const filteredStarred = starredQuestions.filter(q => 
    q.text.toLowerCase().includes(search.toLowerCase()) || 
    q.chapter.toLowerCase().includes(search.toLowerCase())
  );

  const filteredNotes = notes.filter(n => 
    (n.description || '').toLowerCase().includes(search.toLowerCase()) || 
    (n.keywords || '').toLowerCase().includes(search.toLowerCase()) || 
    (n.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const [isNaming, setIsNaming] = useState<File | null>(null);
  const [noteName, setNoteName] = useState('');
  const [noteKeywords, setNoteKeywords] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [longPressNote, setLongPressNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewDescriptionNote, setViewDescriptionNote] = useState<Note | null>(null);
  const [aiInsightPhoto, setAiInsightPhoto] = useState<Note | null>(null);
  const [aiInsightText, setAiInsightText] = useState('');
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleAiInsight = async (note: Note) => {
    setPreloadedAIPhoto(note);
    setGlobalTab('settings');
    setLongPressNote(null);
  };

  const handleFileUpload = (file: File) => {
    // Extract base name without extension
    const baseName = file.name.split('.').slice(0, -1).join('.') || file.name;
    // Suggest keywords: clean special chars, filter short words
    const suggested = baseName
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .join(', ');

    setIsNaming(file);
    setNoteName(baseName);
    setNoteKeywords(suggested);
    setNoteDescription('');
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_SIZE = 1000;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const confirmUpload = async () => {
    if (!isNaming || !noteName) return;
    
    try {
      const photoData = await compressImage(isNaming);
      addNote({
        id: Date.now().toString(),
        name: noteName,
        description: noteDescription || '',
        keywords: noteKeywords || '',
        photo: photoData,
        timestamp: new Date().toISOString()
      });
      setLastUploadedPhotoName(noteName);
      setIsNaming(null);
      setNoteName('');
      setNoteKeywords('');
      setNoteDescription('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 py-6 pb-12">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-display font-bold">Library Archives</h2>
          {isOffline && <span className="text-[10px] font-black uppercase text-orange-accent bg-orange-accent/10 px-2 py-1 rounded-full">Offline Mode</span>}
        </div>
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
                  <div className="p-4 bg-[#4CAF50]/5 rounded-xl border border-[#4CAF50]/20 shadow-inner">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#4CAF50] mb-1 opacity-70">Authenticated Result</p>
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
                    <h3 className="font-bold text-lg">Name and Tag this note</h3>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-text-muted px-1">Note Title</p>
                      <input 
                        type="text" 
                        placeholder="Note Title..."
                        value={noteName} 
                        onChange={(e) => setNoteName(e.target.value)}
                        className="w-full p-3 border border-line rounded-xl outline-none focus:border-orange-accent transition-all text-sm"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-text-muted px-1">Keywords</p>
                      <input 
                        type="text" 
                        placeholder="Keywords (comma separated)..."
                        value={noteKeywords}
                        onChange={(e) => setNoteKeywords(e.target.value)}
                        className="w-full p-3 border border-line rounded-xl outline-none focus:border-orange-accent transition-all text-sm"
                        id="note-keywords"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center px-1">
                        <p className="text-[10px] font-black uppercase text-text-muted">Note Text</p>
                        <p className={cn("text-[9px] font-bold", noteDescription.length > 250 ? "text-orange-accent" : "text-text-muted")}>
                          {noteDescription.length}/300
                        </p>
                      </div>
                      <textarea 
                        placeholder="Add some details..."
                        value={noteDescription}
                        onChange={(e) => setNoteDescription(e.target.value.slice(0, 300))}
                        className="w-full p-3 border border-line rounded-xl outline-none focus:border-orange-accent transition-all text-sm h-24 resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setIsNaming(null)} className="flex-1 p-3 bg-[#E8E8E1] text-text-muted rounded-xl font-bold uppercase text-xs tracking-widest active:scale-95 transition-transform">Cancel</button>
                      <button onClick={confirmUpload} className="flex-1 p-3 bg-olive-primary text-white rounded-xl font-bold uppercase text-xs tracking-widest active:scale-95 transition-transform shadow-lg shadow-olive-primary/20">Save Note</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {filteredNotes.map((n) => (
                <div 
                  key={n.id} 
                  className="relative group aspect-square rounded-2xl overflow-hidden bg-white border border-line shadow-sm cursor-pointer select-none"
                  onPointerDown={() => {
                    pressTimer.current = setTimeout(() => {
                      setLongPressNote(n);
                    }, 500);
                  }}
                  onPointerUp={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                  }}
                  onPointerLeave={() => {
                    if (pressTimer.current) clearTimeout(pressTimer.current);
                  }}
                  onClick={() => {
                    if (!longPressNote) setViewingPhoto(n.photo);
                  }}
                >
                  {n.photo ? (
                    <img src={n.photo} alt="Note" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#F4F4F0]">
                      <FileText size={32} className="text-[#D6D6CF]" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                    <p className="text-white text-[11px] font-bold truncate tracking-wide">{n.name}</p>
                  </div>
                </div>
              ))}

              <AnimatePresence>
                {longPressNote && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
                    onClick={() => setLongPressNote(null)}
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-white dark:bg-zinc-900 w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl space-y-1 p-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <p className="text-[10px] font-black uppercase text-text-muted text-center py-3 tracking-widest border-b border-line dark:border-white/5">{longPressNote.name}</p>
                      
                      <button 
                        onClick={() => handleAiInsight(longPressNote)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-bg-warm dark:hover:bg-white/5 rounded-2xl transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                          <Brain size={20} />
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-sm">Scan with Neural AI</span>
                          <span className="block text-[10px] text-text-muted">Analyze photo with AI</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => {
                          setViewDescriptionNote(longPressNote);
                          setLongPressNote(null);
                        }}
                        className="w-full p-4 flex items-center gap-4 hover:bg-bg-warm dark:hover:bg-white/5 rounded-2xl transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-accent/10 text-orange-accent flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-sm">View Description</span>
                          <span className="block text-[10px] text-text-muted">Read note content</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => {
                          setEditingNote(longPressNote);
                          setLongPressNote(null);
                        }}
                        className="w-full p-4 flex items-center gap-4 hover:bg-bg-warm dark:hover:bg-white/5 rounded-2xl transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                          <Plus className="rotate-45" size={20} />
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-sm">Edit Info</span>
                          <span className="block text-[10px] text-text-muted">Rename or update tags</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => {
                          setViewingPhoto(longPressNote.photo);
                          setLongPressNote(null);
                        }}
                        className="w-full p-4 flex items-center gap-4 hover:bg-bg-warm dark:hover:bg-white/5 rounded-2xl transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <Maximize2 size={20} />
                        </div>
                        <span className="font-bold text-sm">Open Preview</span>
                      </button>

                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = longPressNote.photo;
                          link.download = `${longPressNote.name || 'note'}.png`;
                          link.click();
                          setLongPressNote(null);
                        }}
                        className="w-full p-4 flex items-center gap-4 hover:bg-bg-warm dark:hover:bg-white/5 rounded-2xl transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-olive-primary/10 text-olive-primary flex items-center justify-center">
                          <Download size={20} />
                        </div>
                        <span className="font-bold text-sm">Download Image</span>
                      </button>

                      <button 
                        onClick={() => {
                          deleteNote(longPressNote.id);
                          setLongPressNote(null);
                        }}
                        className="w-full p-4 flex items-center gap-4 hover:bg-orange-accent/10 rounded-2xl transition-all text-orange-accent"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-accent/10 text-orange-accent flex items-center justify-center">
                          <Trash2 size={20} />
                        </div>
                        <span className="font-bold text-sm">Delete Forever</span>
                      </button>

                      <button 
                        onClick={() => setLongPressNote(null)}
                        className="w-full p-4 text-center text-xs font-black uppercase tracking-widest text-text-muted hover:text-text-main transition-colors mt-2"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {editingNote && (
                  <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white dark:bg-zinc-900 p-6 rounded-3xl w-full max-w-sm space-y-4 shadow-2xl"
                    >
                      <h3 className="font-display font-bold text-lg flex items-center gap-2">
                        <Plus className="rotate-45" size={20} />
                        Edit Note Info
                      </h3>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-text-muted px-1">Note Title</p>
                        <input 
                          type="text" 
                          value={editingNote.name}
                          onChange={(e) => setEditingNote({...editingNote, name: e.target.value})}
                          className="w-full p-3 bg-bg-warm dark:bg-white/5 border border-line dark:border-white/10 rounded-xl outline-none focus:border-olive-primary transition-all text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-text-muted px-1">Keywords</p>
                        <input 
                          type="text" 
                          value={editingNote.keywords || ''}
                          onChange={(e) => setEditingNote({...editingNote, keywords: e.target.value})}
                          className="w-full p-3 bg-bg-warm dark:bg-white/5 border border-line dark:border-white/10 rounded-xl outline-none focus:border-olive-primary transition-all text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-text-muted px-1">Full Description</p>
                        <textarea 
                          value={editingNote.description}
                          onChange={(e) => setEditingNote({...editingNote, description: e.target.value})}
                          className="w-full h-32 p-3 bg-bg-warm dark:bg-white/5 border border-line dark:border-white/10 rounded-xl outline-none focus:border-olive-primary transition-all text-sm resize-none"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button onClick={() => setEditingNote(null)} className="flex-1 p-3 bg-bg-warm dark:bg-white/10 text-text-muted rounded-xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-transform">Cancel</button>
                        <button 
                          onClick={() => {
                            updateNote(editingNote);
                            setEditingNote(null);
                          }} 
                          className="flex-1 p-3 bg-olive-primary text-white rounded-xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-transform shadow-lg shadow-olive-primary/20"
                        >
                          Save Changes
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* View Description Modal */}
              <AnimatePresence>
                {viewDescriptionNote && (
                  <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setViewDescriptionNote(null)}>
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white dark:bg-zinc-900 p-6 rounded-3xl w-full max-w-sm space-y-6 shadow-2xl relative"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center bg-bg-warm/50 dark:bg-white/5 -mx-6 -mt-6 p-4 border-b border-line dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-accent/10 text-orange-accent rounded-lg flex items-center justify-center">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-text-muted leading-none">Note Archives</p>
                            <p className="text-sm font-bold text-text-main truncate max-w-[150px]">{viewDescriptionNote.name}</p>
                          </div>
                        </div>
                        <button onClick={() => setViewDescriptionNote(null)} className="p-2 text-text-muted hover:text-text-main">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="space-y-4 pt-2">
                        {viewDescriptionNote.keywords && (
                          <div className="flex flex-wrap gap-2">
                            {viewDescriptionNote.keywords.split(',').map((kw, i) => (
                              <span key={i} className="bg-bg-warm dark:bg-white/5 text-[9px] font-bold px-2 py-1 rounded text-text-muted truncate">#{kw.trim()}</span>
                            ))}
                          </div>
                        )}
                        <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                          <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">{viewDescriptionNote.description || 'No description provided for this note.'}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setViewDescriptionNote(null)}
                        className="w-full py-4 bg-bg-warm dark:bg-white/10 text-text-muted rounded-[20px] font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-transform"
                      >
                        Close Archive
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

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
