import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-slate-900 flex flex-col items-center justify-center p-10"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="w-24 h-24 bg-orange-accent rounded-[32px] flex items-center justify-center text-white mb-8 shadow-[0_0_50px_rgba(255,99,33,0.3)]"
      >
        <Brain size={48} />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">NEET PREP</h1>
        <div className="flex items-center justify-center gap-2 text-orange-accent">
          <Sparkles size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Initializing Neural Link</span>
        </div>
      </motion.div>

      <div className="absolute bottom-16 left-0 right-0 px-12">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-orange-accent"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
