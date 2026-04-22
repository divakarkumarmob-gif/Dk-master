import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudOff, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineManager: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-24 left-4 right-4 z-50"
                >
                    <div className="bg-zinc-900 border border-red-500/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center shrink-0">
                            <WifiOff size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black text-white uppercase tracking-widest">Offline Mode Active</p>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                                Limited access. You can still practice with local questions!
                            </p>
                        </div>
                        <div className="bg-zinc-800 px-2 py-1 rounded text-[8px] font-bold text-zinc-400 uppercase">
                            No Network
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
