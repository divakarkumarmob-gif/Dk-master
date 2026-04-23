import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

export const Toast: React.FC = () => {
    const { toast, showToast } = useAppStore();

    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    className="fixed bottom-24 left-6 right-6 z-[100] flex justify-center pointer-events-none"
                >
                    <div className={cn(
                        "pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl min-w-[280px] max-w-[90vw]",
                        toast.type === 'error' ? "bg-red-500/90 text-white" : 
                        toast.type === 'success' ? "bg-emerald-500/90 text-white" : 
                        "bg-zinc-800/90 text-white"
                    )}>
                        <div className="shrink-0">
                            {toast.type === 'error' && <AlertCircle size={20} />}
                            {toast.type === 'success' && <CheckCircle2 size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                        </div>
                        
                        <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-tight leading-tight">
                                {toast.type === 'error' ? 'AI System Alert' : 'Notification'}
                            </p>
                            <p className="text-[11px] font-bold opacity-90 mt-0.5">
                                {toast.message}
                            </p>
                        </div>

                        <button 
                            onClick={() => useAppStore.setState({ toast: null })}
                            className="shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
