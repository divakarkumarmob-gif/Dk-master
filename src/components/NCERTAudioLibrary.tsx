import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  Play, 
  Loader2, 
  X, 
  Music, 
  ChevronRight, 
  FlaskConical, 
  Dna, 
  Atom,
  Headphones,
  Info
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ALL_CHAPTERS } from '../data/chapters';
import { geminiService } from '../services/gemini';
import { cn } from '../lib/utils';

export const NCERTAudioLibrary: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'Physics' | 'Chemistry' | 'Biology' | 'All'>('All');
  const [playingChapter, setPlayingChapter] = useState<{subject: string, chapter: string} | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredChapters = useMemo(() => {
    let list: {subject: string, chapter: string}[] = [];
    Object.entries(ALL_CHAPTERS).forEach(([sub, chapters]) => {
        if (selectedSubject === 'All' || selectedSubject === sub) {
            chapters.forEach(ch => {
                if (ch.toLowerCase().includes(search.toLowerCase())) {
                    list.push({ subject: sub, chapter: ch });
                }
            });
        }
    });
    return list;
  }, [search, selectedSubject]);

  const startPodcast = async (subject: string, chapter: string) => {
    setLoading(true);
    setPlayingChapter({ subject, chapter });
    setText(null);
    
    try {
      const cacheKey = `podcast_${chapter.toLowerCase().replace(/\s+/g, '_')}`;
      const prompt = `Act as an expert NEET educator. Create a concise, conversational NCERT revision podcast script (about 3-4 minutes) for the chapter: "${chapter}" (${subject}). 
      Focus on critical concepts, memory mnemonics, and frequent NEET question areas. 
      Use a mix of Hindi and English (Hinglish) to keep it engaging.
      Format: Return ONLY the script text. No intro/outro formatting.`;
      
      const res = await geminiService.solveDoubt(prompt, undefined, undefined, cacheKey);
      if (res) {
        setText(res);
        // In a real app, we would use TTS here.
        const utterance = new SpeechSynthesisUtterance(res);
        utterance.lang = 'hi-IN';
        utterance.rate = 1.1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const stopPodcast = () => {
    window.speechSynthesis.cancel();
    setPlayingChapter(null);
    setText(null);
  };

  return (
    <div className="space-y-4">
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-line dark:border-white/5 shadow-sm flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center">
                <BookOpen size={24} />
            </div>
            <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-text-main dark:text-white">NCERT Audio Library</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">90+ Chapters • All Subjects</p>
            </div>
        </div>
        <ChevronRight size={20} className="text-text-muted opacity-30" />
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-warm dark:bg-black/95 flex flex-col md:max-w-md md:mx-auto"
          >
            {/* Library Header */}
            <div className="p-6 pb-2 safe-top bg-white dark:bg-zinc-900 border-b border-line dark:border-white/5 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-text-main dark:text-white">Audio Nexus</h2>
                        <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest italic">Global NCERT Repository</p>
                    </div>
                    <button 
                        onClick={() => { setIsOpen(false); stopPodcast(); }}
                        className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-text-muted"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input 
                            type="text"
                            placeholder="Search Chapter (e.g. Genetics...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs font-bold border-none focus:ring-2 ring-purple-500 transition-all outline-none"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {(['All', 'Physics', 'Chemistry', 'Biology'] as const).map(sub => (
                            <button
                                key={sub}
                                onClick={() => setSelectedSubject(sub)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                                    selectedSubject === sub 
                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                                        : "bg-zinc-100 dark:bg-zinc-800 text-text-muted opacity-50"
                                )}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                {filteredChapters.length > 0 ? (
                    filteredChapters.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            onClick={() => !loading && startPodcast(item.subject, item.chapter)}
                            className={cn(
                                "p-4 rounded-2xl flex items-center justify-between border transition-all cursor-pointer",
                                playingChapter?.chapter === item.chapter 
                                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-500 ring-1 ring-purple-500" 
                                    : "bg-white dark:bg-zinc-900 border-line dark:border-white/5 active:scale-95"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    playingChapter?.chapter === item.chapter 
                                        ? "bg-purple-600 text-white" 
                                        : "bg-zinc-100 dark:bg-zinc-800 text-text-muted"
                                )}>
                                    {loading && playingChapter?.chapter === item.chapter ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        item.subject === 'Biology' ? <Dna size={18} /> : 
                                        item.subject === 'Physics' ? <Atom size={18} /> : 
                                        <FlaskConical size={18} />
                                    )}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-purple-600">{item.subject}</p>
                                    <p className={cn(
                                        "text-sm font-bold truncate max-w-[180px]",
                                        playingChapter?.chapter === item.chapter ? "text-purple-700 dark:text-purple-300" : "text-text-main dark:text-white"
                                    )}>{item.chapter}</p>
                                </div>
                            </div>
                            <Play size={16} fill={playingChapter?.chapter === item.chapter ? "currentColor" : "none"} className="text-purple-500" />
                        </motion.div>
                    ))
                ) : (
                    <div className="py-20 text-center space-y-4 opacity-40">
                         <Search size={40} className="mx-auto" />
                         <p className="text-[10px] font-black uppercase tracking-widest">No Matches in Library</p>
                    </div>
                )}
            </div>

            {/* Now Playing Banner */}
            <AnimatePresence>
                {playingChapter && text && (
                     <motion.div 
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="absolute bottom-6 left-6 right-6 bg-zinc-900 text-white p-4 rounded-3xl shadow-2xl border border-white/10 z-20 flex items-center gap-4"
                     >
                        <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
                            <Headphones size={24} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Live Podcasting</p>
                            <p className="text-xs font-bold truncate">{playingChapter.chapter}</p>
                        </div>
                        <button 
                            onClick={stopPodcast}
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                        >
                            <X size={18} />
                        </button>
                     </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
