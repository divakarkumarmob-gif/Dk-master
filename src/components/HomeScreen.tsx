import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Box,
  Brain,
  Zap,
  Quote
} from 'lucide-react';
import { useAppStore, getDailyChapters } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { differenceInDays, format } from 'date-fns';
import { geminiService } from '../services/gemini';
import { VoiceAI } from './VoiceAI';
import { FALLBACK_QUOTES } from '../constants/fallbackData';

interface HomeScreenProps {
  onStartTest: (config: { id: string; type: 'Minor' | 'Major'; subject?: string; chapter?: string }) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartTest }) => {
  const { streak, results, user } = useAppStore();
  const [quote, setQuote] = useState("The only way to do great work is to love what you do.");
  const [dailyData, setDailyData] = useState(getDailyChapters());
  
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
    <div className="space-y-8 py-6">
      {/* Date & Countdown */}
      <div className="flex justify-between items-center px-2">
        <span className="text-sm font-medium text-text-muted">{format(new Date(), 'MMMM dd, yyyy')}</span>
        <span className="bg-orange-accent text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
          {daysLeft > 0 ? daysLeft : 0} DAYS REMAINING
        </span>
      </div>

      <div className="px-2">
        <h2 className="text-2xl font-extrabold text-text-main">Hello, {user?.email?.split('@')[0] || 'Aspirant'}!</h2>
      </div>

      {/* Streak info */}
      <div className="grid grid-cols-2 gap-3 px-2">
        <div className="bg-[#E8E8E1] p-4 rounded-xl text-center">
          <span className="block text-lg font-black text-olive-primary">{streak}</span>
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-tight">Day Streak</span>
        </div>
        <div className="bg-[#E8E8E1] p-4 rounded-xl text-center">
          <span className="block text-lg font-black text-olive-primary">
            {results.length > 0 ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(0) : 0}
          </span>
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-tight">Avg Score</span>
        </div>
      </div>

      {/* Daily Chapters */}
      <div className="space-y-4 px-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-display font-bold flex items-center gap-2 text-olive-dark">
            <Brain size={20} className="text-orange-accent" />
            Daily Targets
          </h2>
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Sync at 1 AM IST</span>
        </div>

        {dailyData.isSunday ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onStartTest({ id: 'major-' + Date.now(), type: 'Major' })}
            className="w-full relative overflow-hidden p-8 rounded-2xl flex items-center justify-between shadow-xl border border-green-500"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-600 to-green-700"></div>
            
            {/* Animation particles */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-white/30"
                        animate={{ 
                            top: ["100%", "-20%"],
                            left: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            scale: [0, 1, 0]
                        }}
                        transition={{ 
                            duration: 4 + Math.random() * 2,
                            repeat: Infinity,
                            delay: i * 0.5
                        }}
                    >
                        <Sparkles size={20} />
                    </motion.div>
                ))}
            </div>

            <div className="text-left relative z-10 text-white">
              <h4 className="text-2xl font-display font-black tracking-tight uppercase">SUNDAY FULL TEST</h4>
              <p className="text-xs opacity-90 font-medium tracking-wide">Calibrate your full NEET potential</p>
            </div>
            <ChevronRight size={32} className="relative z-10 text-white" />
          </motion.button>
        ) : (
          <div className="grid gap-4">
            {Object.entries(dailyData.chapters).map(([subject, chapter]) => (
              <ChapterCard 
                key={subject}
                subject={subject}
                chapter={chapter as string}
                completed={hasCompletedTest(subject, chapter as string)}
                onClick={() => onStartTest({ 
                  id: `minor-${subject}-${Date.now()}`, 
                  type: 'Minor', 
                  subject, 
                  chapter: chapter as string
                })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Daily Quote at Bottom */}
      <div className="px-2 pt-4">
        <div className="quote-box">
          <p className="text-base italic leading-relaxed font-serif mb-3 text-olive-dark">"{quote}"</p>
          <div className="flex justify-between items-center">
            <p className="text-[10px] uppercase tracking-wider font-extrabold opacity-40">Daily Inspiration</p>
            <p className="text-[10px] uppercase tracking-widest font-black text-orange-accent/50">powered by dk</p>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center pb-8 pt-4">
        <h1 className="text-lg font-display font-bold text-olive-primary opacity-40">NEET Master</h1>
        <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-text-muted opacity-30">High Density Prep</p>
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
