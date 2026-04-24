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
  Loader2,
  FileText,
  Activity
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';
import { AISection } from '../components/AISection';
import { AIMemorySystem } from '../components/AIMemorySystem';
import { CompatibilityHub } from '../components/CompatibilityHub';
import { ActiveRecallBot } from '../components/ActiveRecallBot';
import { ErrorFixTest } from '../components/ErrorFixTest';
import { CollapsibleTool } from '../components/CollapsibleTool';
import { EditProfile } from '../components/EditProfile';

const SettingsScreen: React.FC = () => {
  const { user, logout, theme, setTheme, preloadedAIPhoto, setActiveTab } = useAppStore();
  const [showDoubtSolver, setShowDoubtSolver] = useState(preloadedAIPhoto !== null);
  const [showMemory, setShowMemory] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Sync solver visibility with preloaded content
  React.useEffect(() => {
    if (preloadedAIPhoto) {
      setShowDoubtSolver(true);
    }
  }, [preloadedAIPhoto]);

  const handleLogout = async () => {
    await signOut(auth);
    logout();
  };

  if (showDoubtSolver) {
    return <AISection onBack={() => setShowDoubtSolver(false)} />;
  }
  
  if (showMemory) {
    return (
        <div className="space-y-6">
            <button onClick={() => setShowMemory(false)} className="px-2">⬅ Back</button>
            <AIMemorySystem />
        </div>
    );
  }

  if (isEditing) {
    return <EditProfile onBack={() => setIsEditing(false)} />;
  }

  return (
    <div className="space-y-8 py-6">
      <h2 className="text-xl font-display font-bold px-2">Settings</h2>

      {/* Access Denied Toast */}
      {showAccessDenied && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-20 left-6 right-6 bg-red-500 text-white p-4 rounded-2xl text-center font-bold z-[100] shadow-lg">
             Access Denied
          </motion.div>
      )}

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-sm border border-line">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-olive-primary/10 p-1">
            <div className="w-full h-full rounded-full bg-olive-primary/5 flex items-center justify-center text-olive-primary">
              <User size={32} />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-orange-accent text-white rounded-full flex items-center justify-center border-2 border-white dark:border-olive-dark shadow-sm">
             <ShieldCheck size={12} />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-black text-text-main dark:text-white uppercase tracking-tight">{user?.email?.split('@')[0] || 'Learning Pro'}</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{user?.email || 'Authenticated User'}</p>
        </div>
        <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-orange-accent text-white rounded-full text-xs font-black uppercase tracking-widest shadow-md">Edit Profile</button>
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
        <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Memory & Backup</h4>
        <div className="grid gap-3 px-2">
           <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('study_materials')}
            className="w-full relative overflow-hidden p-5 rounded-[28px] flex items-center justify-between group shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
          >
            <div className="flex items-center gap-4 relative z-10 w-full">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                <FileText size={18} />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm block">NCERT & Modules</span>
                <span className="text-[10px] opacity-70">Access uploaded library PDFs</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-white relative z-10" />
          </motion.button>
          
           <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMemory(true)}
            className="w-full relative overflow-hidden p-5 rounded-[28px] flex items-center justify-between group shadow-sm bg-gradient-to-r from-blue-900 to-blue-600 text-white"
          >
            {/* Morphing Butterfly Animation Background */}
            <div className="absolute inset-0 z-0 opacity-40 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `100%`,
                  }}
                  animate={{ 
                    top: [`100%`, `-20%`],
                    x: [0, Math.random() * 50 - 25],
                    rotate: [0, 45, -45, 0]
                  }}
                  transition={{
                    duration: 5 + Math.random() * 5,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles size={16} />
                </motion.div>
              ))}
            </div>
            
            <div className="flex items-center gap-4 relative z-10 w-full">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                <Brain size={18} />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm block">Memory & Backup</span>
                <span className="text-[10px] opacity-70">Access secure system data</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-white relative z-10" />
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
      
      <div className="px-2 space-y-3">
        <CollapsibleTool 
          title="System Health"
          isOpen={openSection === 'health'}
          onToggle={() => setOpenSection(openSection === 'health' ? null : 'health')}
        >
          <CompatibilityHub />
        </CollapsibleTool>

        <CollapsibleTool 
          title="Error & Recall"
          isOpen={openSection === 'error'}
          onToggle={() => setOpenSection(openSection === 'error' ? null : 'error')}
        >
          <div className="space-y-4 pt-2">
            <ActiveRecallBot />
            <ErrorFixTest onStartTest={(config) => {/* Handle test start if needed */}} />
          </div>
        </CollapsibleTool>
      </div>

      <div className="space-y-4">
        <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Support Network</h4>
        <div className="grid gap-3 px-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open('https://t.me/Studymasternote_bot', '_blank')}
            className="w-full relative overflow-hidden p-5 rounded-[28px] flex items-center justify-between group shadow-sm bg-orange-500"
          >
            {/* Animated Bubbles Background */}
            <div className="absolute inset-0 z-0 opacity-40 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-white rounded-full opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `100%`,
                    width: `${Math.random() * 20 + 5}px`,
                    height: `${Math.random() * 20 + 5}px`,
                  }}
                  animate={{ top: `-20%` }}
                  transition={{
                    duration: 3 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-4 relative z-10 w-full">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                <FileText size={18} />
              </div>
              <span className="font-bold text-sm text-white">Download Notes</span>
            </div>
            <ChevronRight size={18} className="text-white relative z-10" />
          </motion.button>
          
          <MenuButton 
            icon={<ShieldCheck size={18} />} 
            label="Admin"             
            onClick={() => {
              if (user?.email === 'divakarkumarmob@gmail.com') {
                setActiveTab('admin');
              } else {
                setShowAccessDenied(true);
                setTimeout(() => setShowAccessDenied(false), 1000);
              }
            }}
          />
          <MenuButton 
            icon={<Instagram size={18} />} 
            label="@mr.divakar00" 
            onClick={() => window.open('https://instagram.com/mr.divakar00', '_blank')}
          />
          <MenuButton 
            icon={<HelpCircle size={18} />} 
            label="Technical Support" 
            subtitle="Share error with app or web"
            onClick={() => window.open('https://t.me/+qDCp4Ra94XFiZDZl', '_blank')}
          />
        </div>
      </div>

      <div className="px-2">
        <button 
          onClick={handleLogout}
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

function MenuButton({ icon, label, subtitle, onClick }: { icon: React.ReactNode, label: string, subtitle?: string, onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full glass-card p-4 rounded-3xl flex items-center justify-between group transition-all hover:bg-white"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-olive-100 flex items-center justify-center text-olive-600 group-hover:bg-orange-brand/10 shrink-0 transition-colors">
          {icon}
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="font-bold text-sm">{label}</span>
          {subtitle && <span className="text-[10px] font-bold text-text-muted mt-0.5">{subtitle}</span>}
        </div>
      </div>
      <ChevronRight size={18} className="text-olive-300 group-hover:text-orange-brand shrink-0 transition-colors" />
    </motion.button>
  );
}


