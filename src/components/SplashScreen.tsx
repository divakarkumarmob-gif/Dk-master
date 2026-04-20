import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-sky-500 z-[9999] flex flex-col items-center justify-center text-white"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl">
          <MessageCircle size={48} className="text-sky-500" />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter mb-1">StudyMaster</h1>
          <p className="text-sky-100 font-bold uppercase tracking-[0.2em] text-[10px]">Study & Connect</p>
        </div>
      </motion.div>
      
      <div className="absolute bottom-12 flex flex-col items-center gap-4">
        <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-full h-full bg-white"
          />
        </div>
        <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Loading Experience</p>
      </div>
    </motion.div>
  );
}
