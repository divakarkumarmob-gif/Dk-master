import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, FileText, Code, Upload, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { CustomPracticeModal } from './CustomPracticeModal';
import { Question } from '../store/useAppStore';

interface HomeScreenProps {
  onStartTest: (config: { 
    id: string; 
    type: 'Minor' | 'Major' | 'Custom'; 
    subject?: string; 
    chapter?: string;
    questions?: Question[];
  }) => void;
}

export const CustomPracticeCollapsible: React.FC<{ onStartTest: HomeScreenProps['onStartTest'] }> = ({ onStartTest }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showComingSoon, setShowComingSoon] = useState(false);

    const handleStartClick = () => {
        setShowComingSoon(true);
        setTimeout(() => setShowComingSoon(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-line dark:border-white/10 overflow-hidden shadow-sm transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-5 flex items-center justify-between text-left"
            >
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Custom Practice</h3>
                <div className={cn("w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-transform duration-300", isOpen && "rotate-180")}>
                    <ChevronDown size={18} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 pt-0 grid grid-cols-2 gap-4">
                            <button 
                                onClick={handleStartClick}
                                className="bg-sky-500/10 hover:bg-sky-500/20 p-6 rounded-2xl flex flex-col items-center gap-2 text-sky-600 transition-colors"
                            >
                                <span className="font-black">Start</span>
                                {showComingSoon && <span className="text-[10px] animate-pulse">Coming Soon!</span>}
                            </button>
                            <button 
                                onClick={() => setShowModal(true)}
                                className="bg-orange-accent/10 hover:bg-orange-accent/20 p-6 rounded-2xl flex flex-col items-center gap-2 text-orange-accent transition-colors"
                            >
                                <span className="font-black">Custom</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showModal && <CustomPracticeModal onClose={() => setShowModal(false)} onStartTest={onStartTest} />}
        </div>
    );
};
