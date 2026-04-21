import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface CollapsibleToolProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const CollapsibleTool: React.FC<CollapsibleToolProps> = ({ title, isOpen, onToggle, children }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-line dark:border-white/5 overflow-hidden">
        <button onClick={onToggle} className="w-full p-4 flex items-center justify-between font-black uppercase text-xs tracking-widest text-text-main dark:text-white">
            {title}
            <ChevronDown size={16} className={cn("transition-transform", isOpen ? "rotate-180" : "")} />
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 space-y-4"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};
