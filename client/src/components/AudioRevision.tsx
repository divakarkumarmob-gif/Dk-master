import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, Play, Pause, SkipForward, SkipBack, ListMusic, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export const AudioRevision: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    return (
        <div className="space-y-4">
             <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden">
                <div className="relative z-10 space-y-4 text-center">
                    <div className="w-16 h-16 bg-orange-accent rounded-[24px] mx-auto flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Headphones size={32} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-[0.15em]">Neural Audio Sync</h4>
                        <p className="text-[10px] text-white/40 uppercase font-black mt-1">Status: Standby</p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-6">
                        <button className="text-white/40"><SkipBack size={20} /></button>
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-xl transform active:scale-95 transition-transform"
                        >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                        </button>
                        <button className="text-white/40"><SkipForward size={20} /></button>
                    </div>

                    <div className="h-1 bg-white/5 rounded-full mt-2 relative">
                        <motion.div 
                            animate={{ width: isPlaying ? "40%" : "0%" }}
                            className="h-full bg-orange-accent absolute left-0 top-0" 
                        />
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             </div>
        </div>
    );
};
