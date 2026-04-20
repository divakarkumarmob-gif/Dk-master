import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  BarChart2, 
  BookOpen, 
  Settings as SettingsIcon,
  User,
  MessageCircle,
} from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { cn } from './lib/utils';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Components
import { AuthScreen } from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import AnalysisScreen from './components/AnalysisScreen';
import NotesScreen from './components/NotesScreen';
import SettingsScreen from './components/SettingsScreen';
import DailyTestScreen from './components/DailyTestScreen';
import StudyTalks from './components/StudyTalks';
import AdminDashboard from './components/AdminDashboard';
import SplashScreen from './components/SplashScreen';
import InstallPwa from './components/InstallPwa';

export default function App() {
  const { user, setUser, setFullState, theme, updateStreak, activeTab, setActiveTab, cleanupOldChatHistory } = useAppStore();
  const [activeTest, setActiveTest] = useState<{ id: string; type: 'Minor' | 'Major'; subject?: string; chapter?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    // Initial cleanup
    cleanupOldChatHistory();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        updateStreak();

        // ☁️ Restore Cloud Data
        setIsSyncing(true);
        try {
          const { dataSync } = await import('./services/dataSync');
          
          // Initial presence update
          dataSync.updateUserPresence(firebaseUser.uid, true);

          const cloudData = await dataSync.fetchUserData(firebaseUser.uid);
          if (cloudData) {
            setFullState({
              results: cloudData.results || [],
              notes: cloudData.notes || [],
              starredQuestions: cloudData.starredQuestions || [],
              chatHistory: cloudData.chatHistory || [],
              streak: cloudData.profile?.streak ?? 0,
              lastLoginDate: cloudData.profile?.lastLoginDate ?? null
            });
          }
        } catch (e) {
          console.error("Cloud data sync failed:", e);
        } finally {
          setIsSyncing(false);
        }
      } else {
        if (user?.uid) {
            import('./services/dataSync').then(({ dataSync }) => {
                dataSync.updateUserPresence(user.uid, false);
            });
        }
        setUser(null);
        setIsSyncing(false);
      }
    });

    // Cleanup: Mark offline when window closes
    const handleUnload = () => {
        if (auth.currentUser) {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            // We use a simple doc update here as we can't easily use dataSync during unload
            setDoc(userRef, { isOnline: false }, { merge: true });
        }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
        unsub();
        window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  if (!user) {
    return <AuthScreen />;
  }

  if (activeTest) {
    return <DailyTestScreen testConfig={activeTest} onBack={() => setActiveTest(null)} />;
  }

  return (
    <div className={cn(
        "min-h-screen", 
        activeTab === 'chat' ? "h-screen border-b-[64px] border-transparent overflow-hidden" : "pb-20", 
        theme === 'dark' ? 'dark' : ''
    )}>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      
      <InstallPwa />

      <div className="h-full flex flex-col relative bg-inherit">
        
        <main className={cn(
            "flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 overflow-hidden flex flex-col",
            activeTab === 'chat' ? "pt-2" : "pt-6"
        )}>
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
            {activeTab === 'chat' && (
              <StudyTalks key="chat" />
            )}
            {activeTab === 'admin' && (
              <AdminDashboard key="admin" />
            )}
            {activeTab === 'settings' && (
              <SettingsScreen key="settings" />
            )}
          </AnimatePresence>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-white border-t border-black/5 flex justify-around items-center px-4 pb-2 z-50 ">
          <TabButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<HomeIcon size={18} />} 
            label="Home" 
          />
          <TabButton 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')} 
            icon={<BarChart2 size={18} />} 
            label="Analysis" 
          />
          <TabButton 
            active={activeTab === 'notes'} 
            onClick={() => setActiveTab('notes')} 
            icon={<BookOpen size={18} />} 
            label="Notes" 
          />
          <TabButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={<MessageCircle size={18} />} 
            label="Talks" 
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<SettingsIcon size={18} />} 
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

