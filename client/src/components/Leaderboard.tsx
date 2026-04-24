import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Star } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const users = [
    { name: 'Neural Drifter', score: 2850, rank: 1 },
    { name: 'Aspirant X', score: 2720, rank: 2 },
    { name: 'Bio Wizard', score: 2680, rank: 3 },
  ];

  return (
    <div className="space-y-4">
      {users.map((u, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-accent/15 flex items-center justify-center text-orange-accent font-black text-xs">
              {u.rank}
            </div>
            <span className="font-bold text-sm text-black dark:text-white">{u.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={14} className="text-orange-accent fill-orange-accent" />
            <span className="font-black text-xs text-orange-accent">{u.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
