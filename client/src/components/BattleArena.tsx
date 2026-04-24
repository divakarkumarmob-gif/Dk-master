import React from 'react';
import { motion } from 'motion/react';
import { Sword, Shield, Trophy, Users } from 'lucide-react';

export const BattleArena: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-[32px] p-6 text-white overflow-hidden relative">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                        <Sword size={24} />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight">PvP Battle Arena</h3>
                    <p className="text-[10px] opacity-60 uppercase font-black tracking-widest">Compete with online neural units</p>
                </div>

                <div className="flex items-center gap-4 py-2">
                    <div className="flex -space-x-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-red-700 bg-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold">U{i}</div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">12 Online Now</span>
                </div>

                <button className="w-full py-4 bg-white text-red-700 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                    Search Opposition
                </button>
            </div>
            <div className="absolute bottom-0 right-0 p-4 opacity-10">
                <Trophy size={80} />
            </div>
        </div>
    );
};
