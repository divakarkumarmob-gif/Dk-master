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
import { useAppStore, Question } from './store/useAppStore';
import { cn } from './lib/utils';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Components
import { AuthScreen } from './pages/AuthScreen';
import HomeScreen from './pages/HomeScreen';
import AnalysisScreen from './pages/AnalysisScreen';
import NotesScreen from './pages/NotesScreen';
import SettingsScreen from './pages/SettingsScreen';
import DailyTestScreen from './pages/DailyTestScreen';
import StudyTalks from './components/StudyTalks';
import AdminDashboard from './pages/AdminDashboard';
import StudyMaterialsScreen from './pages/StudyMaterialsScreen';
import SplashScreen from './components/SplashScreen';
import InstallPwa from './components/InstallPwa';
import { OfflineManager } from './components/OfflineManager';
import { Toast } from './components/Toast';
import { DKLive } from './components/DKLive';

export default function App() {
  const { user, setUser, setFullState, theme, updateStreak, activeTab, setActiveTab, cleanupOldChatHistory, results, notes, starredQuestions, mistakeVault, chatHistory, streak, lastLoginDate } = useAppStore();
  const [activeTest, setActiveTest] = useState<{ 
    id: string; 
    type: 'Minor' | 'Major'; 
    subject?: string; 
    chapter?: string;
    questions?: Question[];
  } | null>(() => {
    // Restore state from localStorage on init
    try {
      const saved = localStorage.getItem('activeTest');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Safety: If it's the bugged 'Custom' type, discard it
      if (parsed.type === 'Custom') {
        localStorage.removeItem('activeTest');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Debounced Sync to Firebase Firestore
  useEffect(() => {
    if (!user) return;
    
    const handler = setTimeout(async () => {
        const { dataSync } = await import('./services/dataSync');
        dataSync.saveUserData(user.uid, { results, notes, starredQuestions, mistakeVault, chatHistory, profile: { streak, lastLoginDate } });
    }, 5000);
    
    return () => clearTimeout(handler);
  }, [results, notes, starredQuestions, mistakeVault, chatHistory, streak, lastLoginDate, user]);

  useEffect(() => {
    // Save state to localStorage whenever it changes
    if (activeTest) {
      localStorage.setItem('activeTest', JSON.stringify(activeTest));
    } else {
      localStorage.removeItem('activeTest');
    }
  }, [activeTest]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (activeTest) {
        event.preventDefault();
        // Prevent back from exiting app, close test instead
        setActiveTest(null);
        window.history.pushState(null, '', window.location.href);
      }
    };

    if (activeTest) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
        window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTest]);

  useEffect(() => {
    // Sync theme with HTML element for Tailwind dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Force Home tab on app launch as per user request
    setActiveTab('home');
    
    const timer = setTimeout(() => setShowSplash(false), 1000);
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
            // Point 3 Fix: Merge Cloud Data with Local Data instead of overwriting
            // This prevents losing data created while offline
            const currentState = useAppStore.getState();
            
            const mergeById = (local: any[], cloud: any[]) => {
              const cloudIds = new Set(cloud.map(i => i.id));
              // Keep items that are only in local (newly created offline) + all cloud items
              return [
                ...local.filter(i => !cloudIds.has(i.id)),
                ...cloud
              ];
            };

            setFullState({
              results: mergeById(currentState.results, cloudData.results || []),
              notes: mergeById(currentState.notes, cloudData.notes || []),
              starredQuestions: mergeById(currentState.starredQuestions, cloudData.starredQuestions || []),
              mistakeVault: mergeById(currentState.mistakeVault, cloudData.mistakeVault || []),
              chatHistory: mergeById(currentState.chatHistory, cloudData.chatHistory || []),
              streak: Math.max(currentState.streak, cloudData.profile?.streak ?? 0),
              lastLoginDate: cloudData.profile?.lastLoginDate || currentState.lastLoginDate
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
            setDoc(userRef, { isOnline: false }, { merge: true });
        }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
        unsub();
        window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Heartbeat Presence Effect (Optimized for Battery/Data)
  useEffect(() => {
    if (!user?.uid) return;
    
    let interval: NodeJS.Timeout;

    const startHeartbeat = () => {
      // Immediate update on focus
      import('./services/dataSync').then(({ dataSync }) => {
        dataSync.updateUserPresence(user.uid, true);
      });
      
      interval = setInterval(async () => {
        if (document.visibilityState === 'visible') {
          const { dataSync } = await import('./services/dataSync');
          dataSync.updateUserPresence(user.uid, true);
        }
      }, 90000); // Increased to 1.5 mins to save battery (still within 2min offline threshold)
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startHeartbeat();
      } else {
        clearInterval(interval);
        // Mark as offline in cloud after a small delay to allow for quick app switching
        setTimeout(() => {
           if (document.visibilityState !== 'visible') {
             import('./services/dataSync').then(({ dataSync }) => {
               dataSync.updateUserPresence(user.uid, false);
             });
           }
        }, 3000);
      }
    };

    if (document.visibilityState === 'visible') {
      startHeartbeat();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.uid]);

  if (!user) {
    return <AuthScreen />;
  }

  if (activeTest) {
    return <DailyTestScreen testConfig={activeTest} onBack={() => setActiveTest(null)} />;
  }

  return (
    <div className={cn(
        (activeTab === 'chat' || activeTab === 'admin') ? "h-[100dvh] overflow-hidden" : "min-h-screen",
        "flex flex-col", 
        theme === 'dark' ? 'dark' : ''
    )}>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      
      <InstallPwa />
      <OfflineManager />
      <Toast />
      
      {activeTab === 'home' && <DKLive />}

      <div className={cn(
          "flex-1 flex flex-col relative bg-inherit",
          (activeTab === 'chat' || activeTab === 'admin') ? "overflow-hidden" : ""
      )}>
        
        <main className={cn(
            "flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col",
            (activeTab === 'chat' || activeTab === 'admin') ? "overflow-hidden" : "",
            "pt-6 pb-[80px]"
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
            {activeTab === 'study_materials' && (
              <StudyMaterialsScreen key="study_materials" />
            )}
          </AnimatePresence>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-white dark:bg-slate-950 border-t border-black/5 dark:border-white/20 flex justify-around items-center px-4 pb-2 z-50">
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
        "flex flex-col items-center gap-1 transition-all duration-300 relative",
        active ? "text-orange-accent" : "text-black dark:text-white"
      )}
      whileTap={{ scale: 0.9 }}
    >
      <div className={cn(
        "p-1.5 rounded-xl transition-all",
        active ? "bg-orange-accent/10 sm:bg-orange-accent/5" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[9px] font-black uppercase tracking-tight transition-all",
        active ? "opacity-100" : "opacity-90"
      )}>{label}</span>
      
      {active && (
        <motion.div 
            layoutId="nav-glow"
            className="absolute -top-[12px] w-8 h-[2px] bg-orange-accent rounded-full shadow-[0_0_8px_rgba(255,107,0,0.5)]" 
        />
      )}
    </motion.button>
  );
}

