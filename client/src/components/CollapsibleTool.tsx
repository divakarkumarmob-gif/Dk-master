import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

interface CollapsibleToolProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}

export const CollapsibleTool: React.FC<CollapsibleToolProps> = ({ title, children, isOpen, onToggle, icon }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-line dark:border-white/10 overflow-hidden shadow-sm transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          {icon && <div className="text-olive-primary dark:text-orange-accent">{icon}</div>}
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-transform duration-300",
          isOpen && "rotate-180"
        )}>
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
            <div className="p-5 pt-0">
               {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
