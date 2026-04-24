import React from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Trophy, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const StudyTalks: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-accent rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Users size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Study Talks</h2>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Connect with Neural Network</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center p-10 space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
          <MessageSquare size={32} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Community Node Offline</h3>
          <p className="text-slate-400 text-sm font-medium">Group discussions are currently undergoing neural sync. Check back later.</p>
        </div>
      </div>
    </div>
  );
};

export default StudyTalks;
