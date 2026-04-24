import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const Toast: React.FC = () => {
  const toast = useAppStore(state => state.toast);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-48px)] max-w-sm"
        >
          <div className={cn(
            "p-4 rounded-[24px] shadow-2xl flex items-center gap-3 border backdrop-blur-xl",
            toast.type === 'success' ? "bg-emerald-500 border-emerald-400 text-white" :
            toast.type === 'error' ? "bg-orange-accent border-orange-400 text-white" :
            "bg-slate-900 border-slate-700 text-white"
          )}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'success' ? <CheckCircle2 size={18} /> :
               toast.type === 'error' ? <AlertCircle size={18} /> :
               <Info size={18} />}
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest leading-tight flex-1">{toast.message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
