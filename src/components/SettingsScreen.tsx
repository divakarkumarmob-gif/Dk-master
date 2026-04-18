import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Moon, 
  Sun, 
  Instagram, 
  LogOut, 
  ChevronRight, 
  HelpCircle, 
  ShieldCheck,
  Brain,
  MessageSquare,
  Sparkles,
  Send,
  Loader2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';
import { AISection } from './AISection';

const SettingsScreen: React.FC = () => {
  const { user, logout, theme, setTheme } = useAppStore();
  const [showDoubtSolver, setShowDoubtSolver] = useState(false);

  if (showDoubtSolver) {
    return <AISection onBack={() => setShowDoubtSolver(false)} />;
  }

  return (
    <div className="space-y-8 py-6">
      <h2 className="text-xl font-display font-bold px-2">Settings</h2>

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-sm border border-line">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-olive-primary/10 p-1">
            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full rounded-full bg-olive-primary/5 flex items-center justify-center text-olive-primary">
                <User size={32} />
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-orange-accent text-white rounded-full flex items-center justify-center border-2 border-white dark:border-olive-dark shadow-sm">
             <ShieldCheck size={12} />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-main">{user?.name}</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{user?.email || (user?.isGuest ? 'Guest Learner' : '')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">AI Intelligence</h4>
        <div className="grid gap-3 px-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{ 
              boxShadow: ["0px 0px 0px rgba(156, 39, 176, 0)", "0px 0px 20px rgba(156, 39, 176, 0.4)", "0px 0px 0px rgba(156, 39, 176, 0)"] 
            }}
            transition={{ duration: 3, repeat: Infinity }}
            onClick={() => setShowDoubtSolver(true)}
            className="w-full relative overflow-hidden p-6 rounded-[32px] flex items-center justify-between group shadow-xl"
          >
            {/* Vibrant Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2196F3] via-[#9C27B0] to-[#673AB7] opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div className="text-left">
                <span className="block font-black text-white text-base tracking-tight">Neural Doubt Solver</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Core Access v3.1</span>
              </div>
            </div>
            <ChevronRight size={22} className="text-white relative z-10 opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
          </motion.button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">System Preference</h4>
        <div className="grid gap-3 px-2">
          <div className="relative overflow-hidden bg-white dark:bg-zinc-900 vibrant-dark-box border border-line dark:border-white/10 p-5 rounded-[28px] shadow-sm flex items-center justify-between transition-all group">
            {/* Sublte Dark Mode Animation Layer */}
            {theme === 'dark' && (
              <motion.div 
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-none"
              />
            )}
            
            <div className="flex items-center gap-4 relative z-10">
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                theme === 'dark' ? "bg-white text-black" : "bg-[#F5F5F0] text-olive-primary"
              )}>
                {theme === 'dark' ? <Moon size={22} fill="currentColor" /> : <Sun size={22} />}
              </div>
              <div>
                <span className="block font-black text-sm text-text-main dark:text-white">Dark Mode</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-text-muted dark:text-white/40">Switch visual core</span>
              </div>
            </div>
            
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "w-14 h-7 rounded-full transition-all relative p-1.5 shadow-inner",
                theme === 'dark' ? "bg-white" : "bg-[#DDD]"
              )}
            >
              <motion.div 
                animate={{ 
                  x: theme === 'dark' ? 28 : 0,
                  backgroundColor: theme === 'dark' ? '#000' : '#FFF'
                }}
                className="w-4 h-4 rounded-full shadow-lg"
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Support Network</h4>
        <div className="grid gap-3 px-2">
          <MenuButton 
            icon={<Instagram size={18} />} 
            label="@mr.divakar00" 
            onClick={() => window.open('https://instagram.com/mr.divakar00', '_blank')}
          />
          <MenuButton 
            icon={<HelpCircle size={18} />} 
            label="Technical Support" 
            onClick={() => {}}
          />
        </div>
      </div>

      <div className="px-2">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-xl text-olive-primary font-bold bg-[#E8E8E1] mt-8 mb-12 transition-colors uppercase text-xs tracking-widest"
        >
          <LogOut size={18} />
          End Session
        </button>
      </div>
    </div>
  );
}

export default SettingsScreen;

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full glass-card p-4 rounded-3xl flex items-center justify-between group transition-all hover:bg-white"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-olive-100 flex items-center justify-center text-olive-600 group-hover:bg-orange-brand/10 transition-colors">
          {icon}
        </div>
        <span className="font-bold text-sm">{label}</span>
      </div>
      <ChevronRight size={18} className="text-olive-300 group-hover:text-orange-brand transition-colors" />
    </motion.button>
  );
}


