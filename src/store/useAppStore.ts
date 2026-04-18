import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ALL_CHAPTERS } from '../data/chapters';

export interface User {
  id: string;
  name: string;
  email?: string;
  photo?: string;
  isGuest?: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: 'Physics' | 'Chemistry' | 'Biology';
  chapter: string;
  isImportance?: boolean;
}

export interface TestResult {
  id: string;
  type: 'Minor' | 'Major';
  subject?: string;
  chapter?: string;
  score: number;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unattempted: number;
  timestamp: string;
  questions: Question[];
  userAnswers: (number | null)[];
  explanations: Record<string, string>;
}

export interface Note {
  id: string;
  name: string;
  text: string;
  photo?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  results: TestResult[];
  notes: Note[];
  starredQuestions: Question[];
  chatHistory: ChatMessage[];
  streak: number;
  lastLoginDate: string | null;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addResult: (result: TestResult) => void;
  addExplanation: (testId: string, questionId: string, explanation: string) => void;
  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  toggleStarQuestion: (question: Question) => void;
  updateStreak: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      theme: 'light',
      results: [],
      notes: [],
      starredQuestions: [],
      chatHistory: [],
      streak: 0,
      lastLoginDate: null,

      login: (user) => set({ user }),
      logout: () => set({ user: null, results: [], notes: [], starredQuestions: [], chatHistory: [], streak: 0 }),
      setTheme: (theme) => set({ theme }),
      addResult: (result) => set((state) => ({ results: [...state.results, { ...result, explanations: {} }] })),
      addExplanation: (testId, questionId, explanation) => set((state) => ({
        results: state.results.map((r) => r.id === testId ? { ...r, explanations: { ...r.explanations, [questionId]: explanation } } : r)
      })),
      addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
      addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
      toggleStarQuestion: (question) => set((state) => {
        const exists = state.starredQuestions.find((q) => q.id === question.id);
        if (exists) {
          return { starredQuestions: state.starredQuestions.filter((q) => q.id !== question.id) };
        }
        return { starredQuestions: [...state.starredQuestions, { ...question, isImportance: true }] };
      }),
      updateStreak: () => {
        const today = new Date().toDateString();
        const lastDate = get().lastLoginDate;
        if (lastDate !== today) {
          set((state) => ({
            streak: state.streak + 1,
            lastLoginDate: today
          }));
        }
      },
    }),
    {
      name: 'neet-prep-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper to get daily chapters
export const getDailyChapters = (date: Date) => {
  const seed = date.getDate() + (date.getMonth() * 31) + (date.getFullYear() * 366);
  
  const getIndex = (arrLength: number, offset: number) => {
    return (seed + offset) % arrLength;
  };

  const isSunday = date.getDay() === 0;

  return {
    isSunday,
    chapters: {
      Physics: ALL_CHAPTERS.Physics[getIndex(ALL_CHAPTERS.Physics.length, 0)],
      Chemistry: ALL_CHAPTERS.Chemistry[getIndex(ALL_CHAPTERS.Chemistry.length, 10)],
      Biology: ALL_CHAPTERS.Biology[getIndex(ALL_CHAPTERS.Biology.length, 20)],
    }
  };
};
