import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronDown
} from 'lucide-react';
import { useAppStore, getDailyChapters, Question } from '../store/useAppStore';
import { Leaderboard } from './Leaderboard';
import { AudioRevision } from './AudioRevision';
import { NCERTAudioLibrary } from './NCERTAudioLibrary';
import { RapidFireQuiz } from './RapidFireQuiz';
import { BattleArena } from './BattleArena';
import { ConceptBot } from './ConceptBot';
import { ErrorFixTest } from './ErrorFixTest';
import { VisualDecoder } from './VisualDecoder';
import { PlannerBot } from './PlannerBot';
import { ConfidenceMap } from './ConfidenceMap';
import { ActiveRecallBot } from './ActiveRecallBot';
import { VideoVault } from './VideoVault';
import { StudyPulse } from './StudyPulse';
import { SavedCheatSheets } from './SavedCheatSheets';
import { QuestionScanner } from './QuestionScanner';
import { CompatibilityHub } from './CompatibilityHub';
import { cn } from '../lib/utils';
import { differenceInDays, format } from 'date-fns';
import { geminiService } from '../services/gemini';
import { VoiceAI } from './VoiceAI';
import { FALLBACK_QUOTES } from '../constants/fallbackData';
import { CollapsibleTool } from './CollapsibleTool';

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
  
  const targetDate = new Date('2026-05-03');
  const daysLeft = differenceInDays(targetDate, new Date());

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const q = await geminiService.solveDoubt("Give me a short, powerful motivational quote for a NEET aspirant. Exactly 2-4 lines only. Avoid special symbols like #, *, $, /.");
        if (q && !q.includes("cooling down")) {
          setQuote(q);
        } else {
          setQuote(FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]);
        }
      } catch (e) {
        console.error("Quote fetch failed", e);
        setQuote(FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]);
      }
    };
    fetchQuote();
  }, []);

  const hasCompletedTest = (subject: string, chapter: string) => {
    return results.some(r => r.type === 'Minor' && r.subject === subject && r.chapter === chapter && r.correct >= 25);
  };

  return (
    <div className="space-y-6 py-6 pb-20">
      {/* Date & Countdown */}
      <div className="flex justify-between items-center px-4">
        <span className="text-sm font-medium text-text-muted">{format(new Date(), 'MMMM dd, yyyy')}</span>
        <span className="bg-orange-accent text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
          {daysLeft > 0 ? daysLeft : 0} DAYS REMAINING
        </span>
      </div>

      {/* Tab Navigation Icons/Boxes */}
      <div className="grid grid-cols-2 gap-3 px-4 sticky top-0 z-40 py-3">
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
      </div>

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
                
                <div className="space-y-8 relative z-10">
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
                    <BattleArena />
                    <RapidFireQuiz />
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
            <h2 className="text-lg font-display font-bold flex items-center gap-2 text-olive-dark dark:text-white uppercase tracking-widest">
                <Trophy size={20} className="text-yellow-500" />
                Elite Ranking
            </h2>
            <Leaderboard />
        </div>

        <div className="quote-box">
          <p className="text-base italic leading-relaxed font-serif mb-3 text-olive-dark">"{quote}"</p>
          <div className="flex justify-between items-center">
            <p className="text-[10px] uppercase tracking-wider font-extrabold opacity-40">Daily Inspiration</p>
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
    </div>
  );
}

export default HomeScreen;

const ChapterCard: React.FC<{ subject: string, chapter: string, completed: boolean, onClick: () => void }> = ({ subject, chapter, completed, onClick }) => {
  const borderColors: Record<string, string> = {
    Physics: 'border-l-olive-primary',
    Chemistry: 'border-l-orange-accent',
    Biology: 'border-l-[#4CAF50]'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "bg-white p-4 rounded-2xl flex items-center justify-between cursor-pointer border-l-[6px] shadow-sm transition-all",
        borderColors[subject]
      )}
    >
      <div className="subj-info">
        <h3 className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1">{subject}</h3>
        <p className="text-[15px] font-bold text-text-main line-clamp-1">{chapter}</p>
      </div>
      <button className={cn(
        "py-2.5 px-4 rounded-xl text-xs font-bold transition-colors",
        completed ? "bg-[#E8E8E1] text-olive-primary" : "bg-olive-primary text-white"
      )}>
        {completed ? "Done ✔️" : "Start Test"}
      </button>
    </motion.div>
  );
}
