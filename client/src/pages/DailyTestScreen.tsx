import React from 'react';
import { motion } from 'motion/react';
import { Target, Timer, ChevronLeft, CheckCircle2, ChevronRight, Calculator, Info, HelpCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface DailyTestScreenProps {
    testConfig: {
        id: string;
        type: 'Minor' | 'Major';
        subject?: string;
        chapter?: string;
    };
    onBack: () => void;
}

const DailyTestScreen: React.FC<DailyTestScreenProps> = ({ testConfig, onBack }) => {
    return (
        <div className="fixed inset-0 bg-[#f8f9fa] z-[100] flex flex-col">
            <header className="flex items-center justify-between p-6 bg-white border-b border-line shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-800">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-tight">{testConfig.type} Protocol</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{testConfig.subject || 'Full Syllabus'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-orange-accent/10 px-3 py-1.5 rounded-full">
                    <Timer size={14} className="text-orange-accent" />
                    <span className="text-[10px] font-black text-orange-accent">59:59</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
                    <Target size={40} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Test Core Offline</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">The adaptive inquiry subsystem is currently syncing with the neural database. Please try again in 30 seconds.</p>
                </div>
                <button 
                  onClick={onBack}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                    Return to Hub
                </button>
            </div>
        </div>
    );
};

export default DailyTestScreen;
