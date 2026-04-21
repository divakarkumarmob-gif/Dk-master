import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  StopCircle, 
  Headphones, 
  Sparkles, 
  Loader2, 
  ChevronRight,
  Music,
  Volume2
} from 'lucide-react';
import { useAppStore, getDailyChapters } from '../store/useAppStore';
import { geminiService } from '../services/gemini';
import { cn } from '../lib/utils';

interface AudioRevisionProps {
  showCompact?: boolean;
}

export const AudioRevision: React.FC<AudioRevisionProps> = ({ showCompact }) => {
  const { theme } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<{subject: string, chapter: string} | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const dailyData = getDailyChapters();

  const chapters = Object.entries(dailyData.chapters).map(([subject, chapter]) => ({
    subject,
    chapter: chapter as string
  }));

  const startPodcast = async (subject: string, chapter: string) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    setLoading(true);
    setSelectedChapter({ subject, chapter });
    setIsPlaying(false);

    try {
      const prompt = `Act as an expert NEET teacher. Give me 10 most high-yield, NCERT-based bullet points for the chapter "${chapter}" in ${subject}. Format as plain text summary that sounds good when spoken aloud. Use simple Hinglish where needed for emphasis. Avoid symbols like *, #, etc. Just the content.`;
      const content = await geminiService.solveDoubt(prompt);
      
      if (content) {
        setText(content);
        playText(content);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const playText = (content: string) => {
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'hi-IN'; // Using Hindi-India for Hinglish feel
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const togglePlayback = () => {
    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      }
    }
  };

  const stopPodcast = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setText(null);
    setSelectedChapter(null);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="space-y-4">
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden cursor-pointer",
          showCompact ? "p-4" : "p-6"
        )}
      >
        <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
                <h3 className={cn(
                  "font-black uppercase tracking-widest flex items-center gap-2",
                  showCompact ? "text-sm" : "text-lg"
                )}>
                    <Headphones size={showCompact ? 16 : 20} className={cn("text-white", isPlaying && "animate-bounce")} />
                    Audio Revision
                </h3>
                {!showCompact && (
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter italic">
                      {isOpen ? 'Click to minimize list' : 'Listen & Memorize while you rest'}
                  </p>
                )}
            </div>
            <div className="flex items-center gap-3">
                <Music size={showCompact ? 18 : 24} className={cn("opacity-20 transition-transform duration-500", isOpen ? "rotate-180 scale-125" : "rotate-12")} />
                <ChevronRight size={14} className={cn("transition-transform duration-300", isOpen ? "rotate-90" : "")} />
            </div>
        </div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3"
          >
            {chapters.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !loading && startPodcast(item.subject, item.chapter)}
                className={cn(
                    "bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center justify-between border border-line dark:border-white/5 transition-all shadow-sm",
                    selectedChapter?.chapter === item.chapter && "ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20"
                )}
              >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        selectedChapter?.chapter === item.chapter ? "bg-indigo-500 text-white" : "bg-[#E8E8E1] dark:bg-zinc-800 text-text-muted"
                    )}>
                        {loading && selectedChapter?.chapter === item.chapter ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Play size={20} fill={selectedChapter?.chapter === item.chapter ? "currentColor" : "none"} />
                        )}
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-text-muted dark:text-zinc-500">{item.subject}</p>
                       <p className="text-sm font-bold text-text-main dark:text-white line-clamp-1">{item.chapter}</p>
                    </div>
                </div>
                {selectedChapter?.chapter === item.chapter && (
                    <div className="flex items-center gap-2">
                        <motion.div 
                            animate={{ height: isPlaying ? [4, 12, 4] : 4 }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="w-1 bg-indigo-500 rounded-full"
                        />
                        <motion.div 
                            animate={{ height: isPlaying ? [12, 4, 12] : 8 }}
                            transition={{ repeat: Infinity, duration: 0.6 }}
                            className="w-1 bg-indigo-500 rounded-full"
                        />
                        <motion.div 
                            animate={{ height: isPlaying ? [6, 14, 6] : 5 }}
                            transition={{ repeat: Infinity, duration: 0.4 }}
                            className="w-1 bg-indigo-500 rounded-full"
                        />
                    </div>
                )}
                <ChevronRight size={16} className="text-text-muted opacity-30" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedChapter && text && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-indigo-900 text-white p-5 rounded-[32px] shadow-2xl relative overflow-hidden"
            >
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <Volume2 size={20} className="text-indigo-300" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Now Casting</p>
                            <p className="text-xs font-bold truncate max-w-[150px]">{selectedChapter.chapter}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={togglePlayback}
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button 
                            onClick={stopPodcast}
                            className="w-10 h-10 bg-red-500/20 text-red-300 rounded-full flex items-center justify-center hover:bg-red-500/30 transition-colors"
                        >
                            <StopCircle size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="max-h-[100px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    <p className="text-[11px] font-medium leading-relaxed opacity-80 italic font-serif">
                        {text}
                    </p>
                </div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
