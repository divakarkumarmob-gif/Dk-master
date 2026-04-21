import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 z-[9999] flex flex-col items-center justify-center text-white"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-64 h-64 bg-white/5 backdrop-blur-3xl rounded-[3rem] flex items-center justify-center shadow-2xl border border-white/10 p-2 relative">
          <img src="/logo.png" alt="NEET Prep Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="absolute inset-x-0 bottom-[-60px] text-center">
             <p className="text-sky-100 font-bold uppercase tracking-[0.3em] text-[10px] opacity-40">AI-Powered Preparation</p>
          </div>
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
