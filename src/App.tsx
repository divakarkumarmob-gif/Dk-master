import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  BarChart2, 
  BookOpen, 
  Settings as SettingsIcon,
  LogOut,
  User,
  Search,
  PlusCircle,
  Clock,
  Calendar,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Star,
  Info
} from 'lucide-react';
import { useAppStore, getDailyChapters, User as UserType } from './store/useAppStore';
import { cn } from './lib/utils';

// Components
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import AnalysisScreen from './components/AnalysisScreen';
import NotesScreen from './components/NotesScreen';
import SettingsScreen from './components/SettingsScreen';
import DailyTestScreen from './components/DailyTestScreen';
import { AISection } from './components/AISection';

export default function App() {
  const { user, theme, results, updateStreak } = useAppStore();
  const [activeTab, setActiveTab] = useState<'home' | 'analysis' | 'notes' | 'settings'>('home');
  const [activeTest, setActiveTest] = useState<{ id: string; type: 'Minor' | 'Major'; subject?: string; chapter?: string } | null>(null);

  useEffect(() => {
    if (user) {
      updateStreak();
    }
  }, [user]);

  if (!user) {
    return <LoginScreen />;
  }

  if (activeTest) {
    return <DailyTestScreen testConfig={activeTest} onBack={() => setActiveTest(null)} />;
  }

  return (
    <div className={cn("min-h-screen pb-24", theme === 'dark' ? 'dark' : '')}>
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-inherit">
        
        <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-bg-warm sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-display font-bold text-olive-primary">NEET Master</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">High Density Prep</p>
          </div>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center cursor-pointer shadow-sm"
            onClick={() => setActiveTab('settings')}
          >
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="text-olive-primary" size={20} />
            )}
          </motion.div>
        </header>

        <main className="flex-1 px-6">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <HomeScreen onStartTest={(config) => setActiveTest(config)} key="home" />
            )}
            {activeTab === 'analysis' && (
              <AnalysisScreen key="analysis" />
            )}
            {activeTab === 'notes' && (
              <NotesScreen key="notes" />
            )}
            {activeTab === 'settings' && (
              <SettingsScreen key="settings" />
            )}
          </AnimatePresence>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-black/5 flex justify-around items-center px-4 pb-6 z-50">
          <TabButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<HomeIcon size={20} />} 
            label="Home" 
          />
          <TabButton 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')} 
            icon={<BarChart2 size={20} />} 
            label="Analysis" 
          />
          <TabButton 
            active={activeTab === 'notes'} 
            onClick={() => setActiveTab('notes')} 
            icon={<BookOpen size={20} />} 
            label="Notes" 
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<SettingsIcon size={20} />} 
            label="Settings" 
          />
        </nav>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-orange-accent" : "text-text-muted"
      )}
      whileTap={{ scale: 0.95 }}
    >
      <div className={cn(
        "w-6 h-6 rounded-md flex items-center justify-center transition-opacity",
        active ? "bg-orange-accent/20" : "bg-text-muted/10 opacity-20"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </motion.button>
  );
}

