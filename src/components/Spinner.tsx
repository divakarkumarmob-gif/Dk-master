import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 24, className, label }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 size={size} className="text-emerald-500" />
      </motion.div>
      {label && (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};
