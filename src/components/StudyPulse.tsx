import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Globe, 
  Flame, 
  Zap, 
  Activity, 
  TrendingUp,
  MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';

export const StudyPulse: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState(1243);
  const [pulseVisible, setPulseVisible] = useState(true);

  // Simulate live fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + (Math.floor(Math.random() * 7) - 3));
      setPulseVisible(false);
      setTimeout(() => setPulseVisible(true), 100);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const trendingSubjects = [
    { name: 'Org. Chemistry', percent: 42, color: 'bg-orange-500' },
    { name: 'Human Physio', percent: 31, color: 'bg-emerald-500' },
    { name: 'Electrostatics', percent: 27, color: 'bg-blue-500' }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/20 text-emerald-500 rounded-lg flex items-center justify-center border border-emerald-500/30">
            <Globe size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Global Study Pulse</h3>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter opacity-60">Real-time NEET Network</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
            <span className="text-[10px] font-black text-emerald-500 tracking-tighter uppercase">Live Now</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-emerald-500/20 rounded-[32px] p-6 space-y-6 relative overflow-hidden group">
        {/* Glow Effect */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-600/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
            <div>
                <motion.span 
                    key={activeUsers}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-black text-white tracking-tighter"
                >
                    {activeUsers.toLocaleString()}
                </motion.span>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Aspirants Active Across India</p>
            </div>
            <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden bg-zinc-800">
                        <img 
                            src={`https://picsum.photos/seed/user${i}/100/100`} 
                            alt="User" 
                            className="w-full h-full object-cover grayscale opacity-60"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                ))}
            </div>
        </div>

        {/* Trending Tags */}
        <div className="space-y-3 pt-2">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={10} className="text-emerald-500" />
                Current Focused Topics
            </p>
            <div className="flex flex-wrap gap-2">
                {trendingSubjects.map((subject) => (
                    <div key={subject.name} className="flex flex-col gap-1.5 flex-1 min-w-[30%]">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[9px] font-bold text-white uppercase tracking-tighter truncate w-24">{subject.name}</span>
                            <span className="text-[8px] font-black text-zinc-500">{subject.percent}%</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${subject.percent}%` }}
                                className={cn("h-full rounded-full", subject.color)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <p className="text-[10px] font-bold text-zinc-400 uppercase italic">
                    Collective Momentum: <span className="text-white">High</span>
                </p>
            </div>
            <div className="flex items-center gap-1.5">
                <MapPin size={10} className="text-emerald-500" />
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Pan India Coverage</span>
            </div>
        </div>
      </div>

      <div className="px-2 flex items-center gap-2 opacity-40">
          <Globe size={10} className="text-emerald-500" />
          <p className="text-[8px] font-black uppercase tracking-widest text-white">
            Shared energy boosts test performance up to 15%
          </p>
      </div>
    </div>
  );
};
