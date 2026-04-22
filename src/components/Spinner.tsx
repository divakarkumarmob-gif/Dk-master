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
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-emerald-500/10 border-t-emerald-500"
        />
        {/* Inner pulsing circle */}
        <motion.div
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-2 rounded-full bg-emerald-500/40 blur-[2px]"
        />
      </div>
      {label && (
        <p className="text-[10px] font-black uppercase tracking-[1px] text-emerald-500/60 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};
