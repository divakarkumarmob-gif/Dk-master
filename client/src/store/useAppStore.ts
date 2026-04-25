import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface TestResult {
  id: string;
  timestamp: string;
  type: 'Minor' | 'Major';
  subject?: string;
  chapter?: string;
  score: number;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unattempted: number;
  questions: Question[];
  userAnswers: (number | null)[];
  explanations: Record<string, string>;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  subject?: string;
}

interface AppState {
  user: { uid: string; email: string | null; username?: string; photoURL?: string } | null;
  theme: 'light' | 'dark';
  streak: number;
  lastLoginDate: string | null;
  results: TestResult[];
  notes: Note[];
  starredQuestions: Question[];
  mistakeVault: Question[];
  chatHistory: any[];
  activeTab: string;
  preloadedAIPhoto: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  errorLogs: any[];
  
  setUser: (user: { uid: string; email: string | null } | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setActiveTab: (tab: string) => void;
  setFullState: (state: Partial<AppState>) => void;
  updateStreak: () => void;
  addResult: (result: TestResult) => void;
  addExplanation: (resultId: string, qId: string, explanation: string) => void;
  toggleStarQuestion: (question: Question) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  addErrorLog: (message: string) => void;
  deleteErrorLog: (id: string) => void;
  cleanupOldChatHistory: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null as any,
      theme: 'light',
      streak: 0,
      lastLoginDate: null,
      results: [],
      notes: [],
      starredQuestions: [],
      mistakeVault: [],
      chatHistory: [],
      activeTab: 'home',
      preloadedAIPhoto: null,
      toast: null,
      errorLogs: [],

      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setFullState: (newState) => set((state) => ({ ...state, ...newState })),
      
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = get().lastLoginDate;
        
        if (lastLogin !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastLogin === yesterdayStr) {
            set((state) => ({ streak: state.streak + 1, lastLoginDate: today }));
          } else {
            set({ streak: 1, lastLoginDate: today });
          }
        }
      },

      addResult: (result) => set((state) => ({ 
        results: [...state.results, result],
        mistakeVault: [
          ...state.mistakeVault, 
          ...result.questions.filter((q, i) => result.userAnswers[i] !== null && result.userAnswers[i] !== q.correctAnswer)
        ].slice(-50) // Keep last 50 mistakes
      })),

      addExplanation: (resultId, qId, explanation) => set((state) => ({
        results: state.results.map(r => r.id === resultId ? {
          ...r,
          explanations: { ...r.explanations, [qId]: explanation }
        } : r)
      })),

      toggleStarQuestion: (question) => set((state) => {
        const isStarred = state.starredQuestions.some(q => q.text === question.text);
        return {
          starredQuestions: isStarred 
            ? state.starredQuestions.filter(q => q.text !== question.text)
            : [...state.starredQuestions, question]
        };
      }),

      showToast: (message, type = 'info') => {
        set({ toast: { message, type } });
        setTimeout(() => set({ toast: null }), 3000);
      },

      addErrorLog: (message) => set((state) => ({
        errorLogs: [{ id: Date.now().toString(), message, timestamp: new Date().toISOString() }, ...state.errorLogs].slice(0, 20)
      })),

      deleteErrorLog: (id) => set((state) => ({
        errorLogs: state.errorLogs.filter(l => l.id !== id)
      })),

      cleanupOldChatHistory: () => set((state) => ({
        chatHistory: state.chatHistory.slice(-20) // Keep last 20 messages
      })),

      logout: () => set({ 
        user: null, 
        results: [], 
        notes: [], 
        starredQuestions: [], 
        mistakeVault: [], 
        chatHistory: [],
        streak: 0,
        lastLoginDate: null
      })
    }),
    {
      name: 'neet-prep-storage',
    }
  )
);

export const getDailyChapters = () => {
  const day = new Date().getDay();
  if (day === 0) return { isSunday: true, chapters: {} };
  
  // Deterministic "Rotation" of goals based on day of week
  const goals: Record<number, any> = {
    1: { Physics: 'Units and Measurements', Chemistry: 'Some Basic Concepts of Chemistry', Biology: 'The Living World' },
    2: { Physics: 'Motion in a Straight Line', Chemistry: 'Structure of Atom', Biology: 'Biological Classification' },
    3: { Physics: 'Laws of Motion', Chemistry: 'Classification of Elements', Biology: 'Plant Kingdom' },
    4: { Physics: 'Work, Energy and Power', Chemistry: 'Chemical Bonding', Biology: 'Animal Kingdom' },
    5: { Physics: 'System of Particles', Chemistry: 'Thermodynamics', Biology: 'Cell: The Unit of Life' },
    6: { Physics: 'Gravitation', Chemistry: 'Equilibrium', Biology: 'Biomolecules' }
  };
  
  return { isSunday: false, chapters: goals[day] || goals[1] };
};
