import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const OfflineManager: React.FC = () => {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

  React.useEffect(() => {
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] w-fit"
        >
          <div className="bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-orange-400">
            <WifiOff size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Offline Protocol Active</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
