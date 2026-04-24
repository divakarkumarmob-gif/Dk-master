import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';

const InstallPwa: React.FC = () => {
  const [show, setShow] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-x-6 bottom-24 z-[95] bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-2xl flex items-center gap-6"
        >
          <div className="w-12 h-12 bg-orange-accent/20 rounded-2xl flex items-center justify-center text-orange-accent shrink-0">
            <Download size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-black text-sm uppercase tracking-tight">Protocol: Install App</h3>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Faster access & Offline study</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShow(false)}
              className="p-2 text-slate-500"
            >
              <X size={20} />
            </button>
            <button 
              onClick={handleInstall}
              className="px-6 py-3 bg-orange-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
            >
              Install
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPwa;
