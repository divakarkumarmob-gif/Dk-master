import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { User, Chrome } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LoginScreen() {
  const { setUser } = useAppStore();

  const handleGoogleLogin = () => {
    // Mock Google Login
    setUser({
      uid: 'google-123',
      email: 'mr.divakar00@gmail.com',
    });
  };

  const handleGuestLogin = () => {
    setUser({
      uid: 'guest-' + Date.now(),
      email: null,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-warm p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center space-y-10"
      >
        <div className="space-y-4">
          <motion.div 
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 bg-olive-primary/5 border border-olive-primary/10 rounded-2xl mx-auto flex items-center justify-center shadow-inner"
          >
            <div className="w-12 h-12 bg-olive-primary rounded-xl flex items-center justify-center text-white font-display font-black text-2xl">
              N
            </div>
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-black text-olive-dark tracking-tight">NEET PREP PRO</h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.3em]">Precision Engineering for Aspirants</p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full bg-white text-text-main border border-line py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 shadow-sm hover:border-orange-accent transition-all uppercase text-[11px] tracking-widest"
          >
            <Chrome className="text-orange-accent" size={18} />
            Initialize Google Auth
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGuestLogin}
            className="w-full bg-olive-primary text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-olive-primary/20 transition-all uppercase text-[11px] tracking-widest"
          >
            <User size={18} />
            Guest Protocol Access
          </motion.button>
        </div>

        <p className="text-[10px] text-text-muted font-medium max-w-[200px] mx-auto leading-relaxed">
          Authorized personnel only. Data encrypted via local protocol.
        </p>
      </motion.div>
    </div>
  );
}
