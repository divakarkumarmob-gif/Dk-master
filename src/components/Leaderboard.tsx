import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown, TrendingUp, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

export const Leaderboard: React.FC = () => {
  const { leaderboard, fetchLeaderboard, user } = useAppStore();

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Sync every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 p-6 rounded-[32px] text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
           <div className="space-y-1">
             <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-2 font-display">
                <Crown size={24} className="text-yellow-300" />
                ELITE LEADERS
             </h3>
             <p className="text-[10px] font-bold opacity-80 uppercase tracking-tight italic">Today's Peak Architecture Performance</p>
           </div>
           <Trophy size={48} className="opacity-20 -rotate-12" />
        </div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-line dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-line dark:border-white/5 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 flex items-center gap-2">
                <Users size={12} />
                Global Ranking
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-accent animate-pulse flex items-center gap-1">
                <TrendingUp size={12} />
                Live Sync
            </span>
        </div>

        <div className="divide-y divide-line dark:divide-white/5">
            {leaderboard.length > 0 ? (
                leaderboard.map((u, idx) => {
                    const isMe = u.userId === user?.uid;
                    return (
                        <motion.div 
                            key={u.userId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                                "p-4 flex items-center justify-between transition-colors",
                                isMe ? "bg-orange-accent/5" : "hover:bg-zinc-50 dark:hover:bg-white/5"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs",
                                    idx === 0 ? "bg-yellow-400 text-white shadow-lg shadow-yellow-400/20" :
                                    idx === 1 ? "bg-zinc-300 text-white" :
                                    idx === 2 ? "bg-orange-400 text-white" :
                                    "bg-[#E8E8E1] dark:bg-zinc-800 text-text-muted"
                                )}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className={cn(
                                        "text-sm font-bold truncate max-w-[120px]",
                                        isMe ? "text-orange-accent" : "text-text-main dark:text-white"
                                    )}>
                                        {u.displayName} {isMe && "(You)"}
                                    </p>
                                    <p className="text-[9px] uppercase font-black text-text-muted dark:text-zinc-500 tracking-widest">
                                        Level Runner
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-olive-primary dark:text-white">{u.points}</p>
                                <p className="text-[8px] uppercase font-black text-text-muted opacity-50">NEET Points</p>
                            </div>
                        </motion.div>
                    );
                })
            ) : (
                <div className="p-10 text-center space-y-3 opacity-40">
                    <Medal size={32} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Candidates...</p>
                </div>
            )}
        </div>
      </div>

      <div className="p-4 bg-zinc-100 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-line dark:border-white/10">
            <p className="text-[10px] font-bold text-text-muted text-center leading-relaxed italic">
                "Points are earned via Streak Maintenance, Test Performance, and Neural Insights."
            </p>
      </div>
    </div>
  );
};
