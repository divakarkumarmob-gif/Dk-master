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
  const [quote, setQuote] = useState("The only way to do great work is to love what you do.");
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
            setQuote(quotes[dayOfWeek]);
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
              setQuote(quotesArray[dayOfWeek]);
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
    <div className="space-y-6 pb-20">
      {/* Date & Countdown */}
      <div className="flex justify-between items-center px-4 pt-2">
        <span className="text-sm font-medium text-text-muted">{format(new Date(), 'MMMM dd, yyyy')}</span>
        <span className="bg-orange-accent text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
          {daysLeft > 0 ? daysLeft : 0} DAYS REMAINING
        </span>
      </div>

      {/* Tab Navigation Icons/Boxes */}
      <motion.div 
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: "-100%", opacity: 0 }
        }}
        animate={isNavVisible ? "visible" : "hidden"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="grid grid-cols-2 gap-3 px-4 sticky top-0 z-40 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-md"
      >
        <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveHub('main')}
            className={cn(
                "py-2.5 px-4 rounded-[18px] border-2 transition-all flex items-center justify-center gap-3",
                activeHub === 'main' 
                    ? "bg-white dark:bg-zinc-800 border-orange-accent shadow-lg shadow-orange-500/10" 
                    : "bg-zinc-800/50 border-transparent opacity-60"
            )}
        >
            <Box size={18} className={activeHub === 'main' ? "text-orange-accent" : "text-text-muted"} />
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Main Hub</span>
        </motion.button>
        <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveHub('study')}
            className={cn(
                "py-2.5 px-4 rounded-[18px] border-2 transition-all flex items-center justify-center gap-3",
                activeHub === 'study' 
                    ? "bg-zinc-950 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                    : "bg-zinc-800/50 border-transparent opacity-60"
            )}
        >
            <Brain size={18} className={activeHub === 'study' ? "text-emerald-400" : "text-text-muted"} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest leading-none", activeHub === 'study' ? "text-white" : "text-text-muted")}>Study Hub</span>
        </motion.button>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeHub === 'main' ? (
          <motion.div 
            key="main-hub"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-1"
          >
            {/* Operational Base Content - No Outer Box */}
            <div className="px-4 space-y-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-accent">Operational Greeting</p>
                    <h2 className="text-xl font-black text-text-main dark:text-white uppercase tracking-tight">Hello, {user?.email?.split('@')[0] || 'Aspirant'}!</h2>
                </div>

                {/* Compact Streak row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg flex items-center justify-between shadow-sm border border-line dark:border-white/5">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Streak</span>
                    <span className="text-sm font-black text-olive-primary">{streak}</span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg flex items-center justify-between shadow-sm border border-line dark:border-white/5">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Avg</span>
                    <span className="text-sm font-black text-olive-primary">
                      {results.length > 0 ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(0) : 0}
                    </span>
                  </div>
                </div>

                {/* Daily Chapters */}
                <div className="space-y-2">
                  <h2 className="text-base font-black flex items-center gap-2 text-olive-dark dark:text-white uppercase tracking-widest px-1">
                    <Target size={18} className="text-orange-accent" />
                    Today's Goals
                  </h2>
                  {dailyData.isSunday ? (
                    <button onClick={() => onStartTest({ id: 'major-' + Date.now(), type: 'Major' })} className="w-full relative overflow-hidden p-6 rounded-[32px] flex items-center justify-between bg-gradient-to-r from-teal-500 to-green-700 text-white shadow-xl">
                        <span className="text-lg font-black uppercase">Start Full Test</span>
                        <ChevronRight size={20} />
                    </button>
                  ) : (
                    <div className="grid gap-3">
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

                {/* Podcast Section */}
                <AudioRevision showCompact={true} />

                <PlannerBot />

                <StudyPulse />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="study-hub"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-10 px-4 pb-12"
          >
            {/* Study Hub Content */}
            <div className="relative">
                <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Knowledge Nexus</p>
                    <h2 className="text-xl font-black text-text-main dark:text-white uppercase tracking-tight">Active Learning Tools</h2>
                </div>
                
                <div className="space-y-2 relative z-10">
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
                    <QuestionScanner onStartTest={(qs) => onStartTest({ id: 'scan-' + Date.now(), type: 'Minor', questions: qs })} />
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
                    title="Resources & Memory"
                    isOpen={openTool === 'res'}
                    onToggle={() => setOpenTool(openTool === 'res' ? null : 'res')}
                  >
                    <SavedCheatSheets />
                    <ConfidenceMap />
                    <VideoVault />
                    <NCERTAudioLibrary />
                  </CollapsibleTool>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 space-y-8">
        {/* Global Sections */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold flex items-center gap-2 text-olive-dark dark:text-white uppercase tracking-widest">
                  <Trophy size={20} className="text-yellow-500" />
                  Elite Ranking
              </h2>
            </div>
            <Leaderboard />
        </div>

        <div className="quote-box group cursor-pointer" onClick={fetchManualQuote}>
          <p className="text-base italic leading-relaxed font-serif mb-3 text-olive-dark">"{quote}"</p>
          <div className="flex justify-between items-center">
            <p className="text-[10px] uppercase tracking-wider font-extrabold opacity-40">Tap for daily Inspiration</p>
            <p className="text-[10px] uppercase tracking-widest font-black text-orange-accent/50">powered by dk</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8 pt-4">
          <h1 className="text-lg font-display font-bold text-olive-primary opacity-40">NEET Prep</h1>
          <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-text-muted opacity-30">Learn & Connect</p>
        </div>
      </div>

      <VoiceAI />
      
      <VideoModal 
        videoId={activeVideo?.id || null} 
        title={activeVideo?.title} 
        onClose={() => setActiveVideo(null)} 
      />
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
      whileHover={{ scale: 1.02 }}
      className={cn(
        "bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center justify-between border-l-[6px] shadow-sm transition-all dark:border-y dark:border-r dark:border-white/5",
        borderColors[subject]
      )}
    >
      <div className="subj-info pr-2">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1">{subject}</h3>
        <p className="text-[14px] leading-tight font-bold text-text-main dark:text-white line-clamp-2">{chapter}</p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handlePlay}
          disabled={isLoading}
          className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center transition-colors shrink-0 shadow-sm border border-red-100 dark:border-red-500/20"
          title="Watch Lecture"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="ml-0.5" />}
        </button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={cn(
            "py-2.5 px-4 rounded-xl text-xs font-bold transition-colors whitespace-nowrap",
            completed ? "bg-[#E8E8E1] dark:bg-emerald-900/30 text-olive-primary dark:text-emerald-400" : "bg-olive-primary dark:bg-white text-white dark:text-black"
          )}>
          {completed ? "Done ✔️" : "Start Test"}
        </motion.button>
      </div>
    </motion.div>
  );
}
