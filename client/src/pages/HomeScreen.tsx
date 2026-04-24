import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Box,
  Brain,
  Quote,
  Trophy,
  Headphones,
  Play,
  Pause,
  StopCircle,
  Terminal,
  BookOpen,
  Target,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useAppStore, getDailyChapters, Question } from '../store/useAppStore';
import { Leaderboard } from '../components/Leaderboard';
import { AudioRevision } from '../components/AudioRevision';
import { NCERTAudioLibrary } from '../components/NCERTAudioLibrary';
import { RapidFireQuiz } from '../components/RapidFireQuiz';
import { BattleArena } from '../components/BattleArena';
import { ConceptBot } from '../components/ConceptBot';
import { LectureLibrary } from '../components/LectureLibrary';
import { ErrorFixTest } from '../components/ErrorFixTest';
import { VisualDecoder } from '../components/VisualDecoder';
import { PlannerBot } from '../components/PlannerBot';
import { ConfidenceMap } from '../components/ConfidenceMap';
import { ActiveRecallBot } from '../components/ActiveRecallBot';
import { VideoVault } from '../components/VideoVault';
import { StudyPulse } from '../components/StudyPulse';
import { SavedCheatSheets } from '../components/SavedCheatSheets';
import { QuestionScanner } from '../components/QuestionScanner';
import { CompatibilityHub } from '../components/CompatibilityHub';
import { VideoModal } from '../components/VideoModal';
import { cn } from '../lib/utils';
import { differenceInDays, format } from 'date-fns';
import { geminiService } from '../services/gemini';
import { VoiceAI } from '../components/VoiceAI';
import { FALLBACK_QUOTES } from '../constants/fallbackData';
import { CollapsibleTool } from '../components/CollapsibleTool';

interface HomeScreenProps {
  onStartTest: (config: { 
    id: string; 
    type: 'Minor' | 'Major'; 
    subject?: string; 
    chapter?: string;
    questions?: Question[];
  }) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartTest }) => {
  const { streak, results, user } = useAppStore();
  const [quote, setQuote] = useState<{ text: string, author: string }>({ text: "The only way to do great work is to love what you do.", author: "Steve Jobs" });
  const [dailyData, setDailyData] = useState(getDailyChapters());
  const [activeHub, setActiveHub] = useState<'main' | 'study'>('main');
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [showProgress, setShowProgress] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ id: string, title: string } | null>(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious();
    if (previous === undefined || current === previous) return;
    
    if (current > previous && current > 120) {
      setIsNavVisible(false);
    } else if (current < previous) {
      setIsNavVisible(true);
    }
  });

  
  const targetDate = new Date('2026-05-03');
  const daysLeft = differenceInDays(targetDate, new Date());

  useEffect(() => {
    // Check for weekly cache
    const today = new Date();
    // Simple week identifier (e.g., ISO week or simply year-week)
    const weekId = format(today, 'Y-ww');
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday

    const storedWeekly = localStorage.getItem('weekly_quotes_cache');
    if (storedWeekly) {
      try {
        const { week, quotes } = JSON.parse(storedWeekly);
        if (week === weekId && Array.isArray(quotes) && quotes.length === 7) {
            setQuote({ text: quotes[dayOfWeek], author: 'DK Tactical' });
            return;
        }
      } catch(e) {}
    }
  }, []);

  const fetchManualQuote = async () => {
    // Tap to refresh week's logic manually or force refresh
    const today = new Date();
    const weekId = format(today, 'Y-ww');
    const dayOfWeek = today.getDay();

    try {
      const q = await geminiService.solveDoubt(
        "Generate exactly 7 distinct, powerful, 2-line motivational quotes for a NEET aspirant for each day of the week. Return a strict JSON array of 7 strings (e.g. ['Quote 1', 'Quote 2', ...]). Do not return any backticks or markdown formatting around the array.",
        undefined,
        undefined,
        `weekly_quotes_${weekId}`
      );
      
      if (q) {
          // Parse JSON directly if the AI properly followed instructions. 
          // Usually we'd want safeJsonParse, but let's do a simple regex or parse
          const jsonMatch = q.match(/\[([\s\S]*?)\]/);
          let quotesArray: string[] = [];
          if (jsonMatch) {
              try {
                  quotesArray = JSON.parse(`[${jsonMatch[1]}]`);
              } catch(e) {
                  console.error("Syntax Error parsing quotes array");
              }
          }
          if (quotesArray.length >= 7) {
              localStorage.setItem('weekly_quotes_cache', JSON.stringify({ week: weekId, quotes: quotesArray }));
              setQuote({ text: quotesArray[dayOfWeek], author: 'DK Tactical' });
              return;
          }
      }
    } catch (e) {}

    // Fallback
    setQuote(FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]);
  };

  const hasCompletedTest = (subject: string, chapter: string) => {
    return results.some(r => r.type === 'Minor' && r.subject === subject && r.chapter === chapter && r.correct >= 25);
  };

  return (
    <div className="space-y-4 px-2 pb-[100px]">
      {/* Date & Countdown */}
      <div className="flex justify-between items-center px-4 pt-4">
        <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Live Mission</p>
            <span className="text-xl font-black text-black dark:text-white uppercase tracking-tighter">{format(new Date(), 'MMMM dd')}</span>
        </div>
        <div className="flex flex-col items-end">
            <span className="bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-lg">
               {daysLeft > 0 ? daysLeft : 0} D-REMAINING
            </span>
        </div>
      </div>

      {/* Hub Navigation */}
      <div className="grid grid-cols-2 gap-3 px-2 py-4">
        <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveHub('main')}
            className={cn(
                "py-3.5 px-4 rounded-[20px] transition-all flex items-center justify-center gap-3 border-2 shadow-sm",
                activeHub === 'main' 
                    ? "bg-white dark:bg-slate-800 border-orange-accent text-orange-accent shadow-orange-500/10" 
                    : "bg-slate-100 dark:bg-slate-900/50 border-transparent text-slate-500 dark:text-slate-400"
            )}
        >
            <Box size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Main Hub</span>
        </motion.button>
        <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveHub('study')}
            className={cn(
                "py-3.5 px-4 rounded-[20px] transition-all flex items-center justify-center gap-3 border-2 shadow-sm",
                activeHub === 'study' 
                    ? "bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10" 
                    : "bg-slate-100 dark:bg-slate-900/50 border-transparent text-slate-500 dark:text-slate-400"
            )}
        >
            <Brain size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Study Lab</span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {activeHub === 'main' ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="px-1 overflow-hidden">
                <AudioRevision />
            </div>

            <div className="grid grid-cols-2 gap-3 px-1">
                <div className="quote-box p-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Streak</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-accent/10 flex items-center justify-center text-orange-accent">
                            <Sparkles size={20} />
                        </div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{streak}</span>
                    </div>
                </div>
                <div className="quote-box p-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Avg Score</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Target size={20} />
                        </div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {results.length > 0 ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(0) : 0}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 px-2">Mission Objectives</h2>
                {dailyData.isSunday ? (
                    <button onClick={() => onStartTest({ id: 'major-' + Date.now(), type: 'Major' })} className="mx-2 p-8 rounded-[40px] bg-slate-900 text-white flex flex-col items-center justify-center gap-4 group">
                        <div className="w-16 h-16 rounded-[24px] bg-white/10 flex items-center justify-center group-active:scale-90 transition-transform">
                            <Trophy size={32} className="text-yellow-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black uppercase tracking-tight">Sunday Major Test</p>
                            <p className="text-[10px] opacity-40 font-bold uppercase tracking-[0.2em]">Full Syllabus Sync</p>
                        </div>
                    </button>
                ) : (
                    <div className="grid gap-4 px-1">
                    {Object.entries(dailyData.chapters).map(([subject, chapter]) => (
                        <ChapterCard 
                        key={subject}
                        subject={subject}
                        chapter={chapter as string}
                        completed={hasCompletedTest(subject, chapter as string)}
                        onClick={() => onStartTest({ id: `minor-${subject}-${Date.now()}`, type: 'Minor', subject, chapter: chapter as string })}
                        onPlay={(id) => setActiveVideo({ id, title: chapter as string })}
                        />
                    ))}
                    </div>
                )}
            </div>

            <div className="px-1">
                <PlannerBot />
            </div>

            <div className="px-1">
                <StudyPulse />
            </div>

            <div className="px-2">
                <Leaderboard />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="study"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3 px-1 pb-12"
          >
            <div className="relative z-10 space-y-3">
                  <CollapsibleTool 
                    title="Lecture Library"
                    isOpen={openTool === 'lectures'}
                    onToggle={() => setOpenTool(openTool === 'lectures' ? null : 'lectures')}
                  >
                    <LectureLibrary />
                  </CollapsibleTool>

                  <CollapsibleTool 
                    title="Neural & AI Tools"
                    isOpen={openTool === 'ai'}
                    onToggle={() => setOpenTool(openTool === 'ai' ? null : 'ai')}
                  >
                    <ConceptBot />
                    <VisualDecoder />
                    <QuestionScanner />
                  </CollapsibleTool>
                  
                  <CollapsibleTool 
                    title="Battle & Practice"
                    isOpen={openTool === 'battle'}
                    onToggle={() => setOpenTool(openTool === 'battle' ? null : 'battle')}
                  >
                    <div className="space-y-4">
                      <BattleArena />
                      <RapidFireQuiz />
                    </div>
                  </CollapsibleTool>

                  <CollapsibleTool 
                    title="Memory Vault"
                    isOpen={openTool === 'res'}
                    onToggle={() => setOpenTool(openTool === 'res' ? null : 'res')}
                  >
                    <SavedCheatSheets />
                    <ConfidenceMap />
                    <VideoVault />
                    <NCERTAudioLibrary />
                  </CollapsibleTool>
                </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Footer Elements */}
      <div className="quote-box mx-1 group cursor-pointer" onClick={fetchManualQuote}>
          <div className="flex items-center gap-3 mb-4">
            <Quote size={20} className="text-orange-accent" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tactical Wisdom</p>
          </div>
          <p className="text-xl font-black leading-tight text-slate-900 dark:text-white uppercase tracking-tight mb-6">"{quote.text}"</p>
          <div className="flex justify-between items-center">
            <p className="text-[10px] uppercase tracking-wider font-extrabold italic text-slate-400">Neural Refresh...</p>
            <p className="text-[10px] uppercase tracking-widest font-black text-orange-accent">Powered by DK</p>
          </div>
      </div>

      <div className="px-1">
        <VoiceAI />
      </div>

      <AnimatePresence>
        {activeVideo && (
          <VideoModal 
            videoId={activeVideo.id} 
            onClose={() => setActiveVideo(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default HomeScreen;

const ChapterCard: React.FC<{ subject: string, chapter: string, completed: boolean, onClick: () => void, onPlay: (id: string) => void }> = ({ subject, chapter, completed, onClick, onPlay }) => {
  const [isLoading, setIsLoading] = useState(false);
  const borderColors: Record<string, string> = {
    Physics: 'border-l-olive-primary dark:border-l-blue-400',
    Chemistry: 'border-l-orange-accent dark:border-l-orange-500',
    Biology: 'border-l-[#4CAF50] dark:border-l-green-400'
  };

  const handlePlay = async () => {
    setIsLoading(true);
    const result = await geminiService.getYoutubeVideoId(`${chapter} full lecture revision NEET ${subject}`);
    if (result && result.id) {
        if (result.blocked) {
            // Channel blocks embed, open YouTube directly
            window.open(`https://www.youtube.com/watch?v=${result.id}`, '_blank');
        } else {
            // Safe to open in custom in-app VideoModal
            onPlay(result.id);
        }
    } else {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(chapter + " revision neet " + subject)}`, '_blank');
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        "bg-white dark:bg-slate-900/50 p-5 rounded-[24px] flex items-center justify-between border-2 shadow-sm transition-all relative overflow-hidden",
        subject === 'Physics' ? "border-blue-500/20" : subject === 'Chemistry' ? "border-orange-500/20" : "border-emerald-500/20"
      )}
    >
      <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5",
          subject === 'Physics' ? "bg-blue-600" : subject === 'Chemistry' ? "bg-orange-600" : "bg-emerald-600"
      )} />
      
      <div className="subj-info pr-4">
        <h3 className={cn(
            "text-[9px] uppercase font-black tracking-[0.2em] mb-1 font-mono",
            subject === 'Physics' ? "text-blue-600 dark:text-blue-400" : subject === 'Chemistry' ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
        )}>{subject}</h3>
        <p className="text-[15px] leading-tight font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-2">{chapter}</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handlePlay}
          disabled={isLoading}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:text-red-500 flex items-center justify-center transition-all shrink-0 hover:shadow-md border border-slate-200 dark:border-white/5"
          title="Watch Lecture"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin text-orange-accent" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={cn(
            "py-3 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border",
            completed 
                ? "bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 cursor-default shadow-none" 
                : "bg-slate-900 dark:bg-white text-white dark:text-black border-transparent hover:shadow-orange-500/10 active:scale-95"
          )}>
          {completed ? "Done" : "Start"}
        </motion.button>
      </div>
    </motion.div>
  );
}
