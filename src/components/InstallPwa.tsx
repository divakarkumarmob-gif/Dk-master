import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPwa() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Automatically show banner after 5 seconds if not installed
      setTimeout(() => {
        setShowBanner(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 bg-sky-500 text-white p-4 rounded-2xl shadow-2xl z-[100] border border-white/20"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <Smartphone size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-sm">Install NEET Prep</h3>
              <p className="text-[10px] opacity-90 font-bold">Add to your home screen for a full app experience!</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick}
                className="bg-white text-sky-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-transform"
              >
                INSTALL
              </button>
              <button 
                onClick={() => setShowBanner(false)}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
