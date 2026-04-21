import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  Users, 
  Zap, 
  Trophy, 
  Timer, 
  Loader2, 
  User,
  ShieldAlert,
  ChevronRight,
  Flame,
  Crown,
  Heart
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { dataSync } from '../services/dataSync';
import { geminiService } from '../services/gemini';
import { cn } from '../lib/utils';
import Confetti from 'react-confetti';

interface DuelState {
    id: string;
    status: 'waiting' | 'active' | 'completed';
    players: Record<string, { name: string, score: number, currentIdx: number, finished: boolean }>;
    questions: any[];
}

export const BattleArena: React.FC = () => {
  const { user } = useAppStore();
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [mode, setMode] = useState<'lobby' | 'searching' | 'battle' | 'result'>('lobby');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [currIdx, setCurrIdx] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const opponentId = duel ? Object.keys(duel.players).find(id => id !== user?.uid) : null;
  const opponent = (duel && opponentId) ? duel.players[opponentId] : null;
  const me = (duel && user) ? duel.players[user.uid] : null;

  // Handle battle completion
  useEffect(() => {
    if (me?.finished && opponent?.finished && mode !== 'result') {
        setMode('result');
        if (me.score >= opponent.score) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
        }
    }
  }, [me?.finished, opponent?.finished, mode]);

  const findBattle = async () => {
    if (!user) return;
    setLoading(true);
    setMode('searching');
    
    // 1. Try to find an existing waiting duel
    const available = await dataSync.findAvailableDuel();
    
    if (available) {
        await dataSync.joinDuel(available.id, { uid: user.uid, displayName: user.email?.split('@')[0] || 'Aspirant' });
        startSubscription(available.id);
    } else {
        // 2. Generate new questions and create duel
        const prompt = `Generate 5 extremely competitive NEET MCQs (Biology/Physics/Chemistry). 
        Format as JSON array of objects { question, options: [4 strings], answer: 0-3 index }. 
        No extra text.`;
        const res = await geminiService.solveDoubt(prompt);
        let questions = [];
        try {
            const match = res?.match(/\[[\s\S]*\]/);
            if (match) questions = JSON.parse(match[0]);
        } catch(e) {}
        
        if (questions.length === 0) {
            setMode('lobby');
            setLoading(false);
            return;
        }

        const duelId = await dataSync.createDuel({ uid: user.uid, displayName: user.email?.split('@')[0] || 'Aspirant' }, questions);
        if (duelId) startSubscription(duelId);
    }
    setLoading(false);
  };

  const startSubscription = (id: string) => {
    dataSync.subscribeToDuel(id, (data) => {
        setDuel(data);
        if (data.status === 'active' && mode === 'searching') {
            setCountdown(3);
        }
    });
  };

  useEffect(() => {
    let timer: any;
    if (countdown !== null && countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
        setMode('battle');
        setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleAnswer = async (idx: number) => {
    if (!duel || !user || selectedIdx !== null) return;
    setSelectedIdx(idx);
    
    const isCorrect = idx === duel.questions[currIdx].answer;
    const newScore = isCorrect ? userScore + 1 : userScore;
    
    setUserScore(newScore);
    
    setTimeout(async () => {
        const nextIdx = currIdx + 1;
        const isFinished = nextIdx >= duel.questions.length;
        
        await dataSync.updateDuelProgress(duel.id, user.uid, newScore, nextIdx, isFinished);
        
        if (!isFinished) {
            setCurrIdx(nextIdx);
            setSelectedIdx(null);
        } else {
            setSelectedIdx(null);
        }
    }, 1000);
  };

  const resetArena = () => {
    setDuel(null);
    setMode('lobby');
    setLoading(false);
    setUserScore(0);
    setCurrIdx(0);
    setSelectedIdx(null);
  };

  return (
    <div className="space-y-4">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} gravity={0.3} />}
      
      <div className="bg-gradient-to-br from-red-600 to-orange-700 p-6 rounded-[32px] text-white shadow-xl shadow-red-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <Swords size={20} className="text-white animate-pulse" />
                    Real-time Battle Dual
                </h3>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter italic">Challenge Live NEET Aspirants</p>
            </div>
            <Flame size={40} className="opacity-20 rotate-12" />
        </div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'lobby' && (
            <motion.div 
                key="lobby"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-line dark:border-white/5 text-center space-y-6"
            >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full mx-auto flex items-center justify-center">
                    <Users size={32} />
                </div>
                <div className="space-y-2">
                    <h4 className="text-xl font-black uppercase tracking-tight text-text-main dark:text-white">Ready for Combat?</h4>
                    <p className="text-xs text-text-muted font-medium px-4">AI will pair you with a live student. High-pressure MCQs, zero mercy.</p>
                </div>
                <button 
                    onClick={findBattle}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-3"
                >
                    <Zap size={16} fill="currentColor" />
                    Find a Match
                </button>
            </motion.div>
        )}

        {mode === 'searching' && (
            <motion.div 
                key="searching"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-[32px] p-12 border border-line dark:border-white/5 text-center space-y-8"
            >
                <div className="relative">
                    <div className="absolute inset-0 animate-ping bg-red-500/10 rounded-full"></div>
                    <div className="w-20 h-20 bg-red-500 text-white rounded-full mx-auto flex items-center justify-center relative z-10">
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-widest animate-pulse">Scanning Nexus...</p>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">Locating a worthy opponent</p>
                </div>
                
                {countdown !== null && (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-6xl font-black text-red-500"
                    >
                        {countdown}
                    </motion.div>
                )}
            </motion.div>
        )}

        {mode === 'battle' && duel && (
            <motion.div 
                key="battle"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="space-y-4"
            >
                {/* Battle Header */}
                <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-[24px] text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <User size={16} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase opacity-60">You</p>
                            <p className="text-xs font-bold">{userScore}/{duel.questions.length}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-red-500 transition-all duration-1000"
                                style={{ width: `${(currIdx / duel.questions.length) * 100}%` }}
                            />
                        </div>
                        <p className="text-[7px] font-black uppercase text-red-500 tracking-widest">VS</p>
                        <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-1000"
                                style={{ width: `${((opponent?.currentIdx || 0) / duel.questions.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                        <div>
                            <p className="text-[8px] font-black uppercase opacity-60">{opponent?.name || 'Opponent'}</p>
                            <p className="text-xs font-bold text-red-400">{opponent?.score || 0}/{duel.questions.length}</p>
                        </div>
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                            <Zap size={16} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 space-y-6 shadow-sm border border-line dark:border-white/5">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                             NEET BATTLE {currIdx + 1}/{duel.questions.length}
                        </span>
                        {opponent?.finished && (
                             <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-black uppercase">Opponent Finished</span>
                        )}
                    </div>

                    <h4 className="text-sm font-bold text-text-main dark:text-white leading-relaxed font-display">
                        {duel.questions[currIdx]?.question}
                    </h4>

                    <div className="grid gap-3">
                        {duel.questions[currIdx]?.options.map((opt: string, i: number) => {
                            const isSelected = selectedIdx === i;
                            const isCorrect = i === duel.questions[currIdx].answer;
                            
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    disabled={selectedIdx !== null}
                                    className={cn(
                                        "w-full p-4 rounded-2xl text-left text-xs font-bold transition-all border",
                                        selectedIdx === null 
                                            ? "border-line dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5" 
                                            : isCorrect 
                                                ? "bg-emerald-500 border-emerald-500 text-white scale-[1.02]" 
                                                : isSelected 
                                                    ? "bg-red-500 border-red-500 text-white" 
                                                    : "opacity-40 border-line dark:border-white/5"
                                    )}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        )}

        {mode === 'result' && duel && (
            <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 rounded-[32px] p-8 text-white text-center space-y-8 border border-white/5"
            >
                <div className="relative">
                    <div className="w-24 h-24 bg-white/5 rounded-full mx-auto flex items-center justify-center">
                        {me!.score >= (opponent?.score || 0) ? (
                            <Crown size={48} className="text-yellow-400" />
                        ) : (
                            <ShieldAlert size={48} className="text-red-400" />
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="text-3xl font-black uppercase tracking-tighter">
                        {me!.score > (opponent?.score || 0) ? 'VICTORY' : me!.score === (opponent?.score || 0) ? 'DRAW' : 'DEFEATED'}
                    </h4>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Battle Session Terminated</p>
                </div>

                <div className="flex items-center justify-center gap-12 py-4 border-y border-white/5">
                    <div>
                        <p className="text-[10px] font-black uppercase text-zinc-500">Your Efficiency</p>
                        <p className="text-2xl font-black text-emerald-400">{((me!.score / duel.questions.length) * 100).toFixed(0)}%</p>
                        <p className="text-[8px] font-bold text-zinc-600">Points: {me!.score * 20}</p>
                    </div>
                    <div className="h-10 w-px bg-white/5"></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-zinc-500">Opponent</p>
                        <p className="text-2xl font-black text-red-500">{((opponent?.score || 0) / duel.questions.length * 100).toFixed(0)}%</p>
                        <p className="text-[8px] font-bold text-zinc-600">Points: {(opponent?.score || 0) * 20}</p>
                    </div>
                </div>

                <button 
                    onClick={resetArena}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
                >
                    Back to Hub
                </button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
