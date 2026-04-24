import React from 'react';
import { motion } from 'motion/react';
import { Target, Calendar, CheckSquare, Sparkles } from 'lucide-react';

export const PlannerBot: React.FC = () => {
    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-line dark:border-white/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 text-black dark:text-white rounded-2xl flex items-center justify-center">
                    <Calendar size={20} />
                </div>
                <div>
                     <h3 className="font-black text-sm uppercase tracking-widest text-black dark:text-white">Neural Planner</h3>
                     <span className="text-[9px] font-black uppercase text-orange-accent tracking-widest">v2.4 Active</span>
                </div>
            </div>

            <div className="space-y-3">
                 <TaskItem label="Complete Units & Measurements" completed />
                 <TaskItem label="Review Biology Ch. 1" />
                 <TaskItem label="Attempt Physics Minor Test" />
            </div>

            <button className="w-full py-4 bg-orange-accent text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                Generate Smart Agenda
            </button>
        </div>
    );
};

const TaskItem = ({ label, completed }: { label: string, completed?: boolean }) => (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-white/5">
        <div className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
            completed ? "bg-orange-accent border-orange-accent text-white" : "border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-zinc-900"
        )}>
            {completed && <CheckSquare size={12} />}
        </div>
        <span className={cn("text-xs font-bold", completed ? "text-slate-400 dark:text-zinc-500 line-through" : "text-slate-900 dark:text-white")}>{label}</span>
    </div>
);

import { cn } from '../lib/utils';
