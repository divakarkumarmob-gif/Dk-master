import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ALL_CHAPTERS } from '../data/chapters';
import { dataSync } from '../services/dataSync';

export interface AuthUser {
  uid: string;
  email: string | null;
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
  description: string;
  keywords?: string;
  photo?: string;
  aiSummary?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface AppState {
  user: AuthUser | null;
  theme: 'light' | 'dark';
  results: TestResult[];
  notes: Note[];
  starredQuestions: Question[];
  chatHistory: ChatMessage[];
  streak: number;
  lastLoginDate: string | null;
  lastAnalyzedPhotoContext: { name: string; summary: string; timestamp: string } | null;
  lastUploadedPhotoName: string | null;
  activeTab: 'home' | 'analysis' | 'notes' | 'settings' | 'chat' | 'admin';
  preloadedAIPhoto: Note | null;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setFullState: (data: Partial<AppState>) => void;
  setActiveTab: (tab: 'home' | 'analysis' | 'notes' | 'settings' | 'chat' | 'admin') => void;
  setPreloadedAIPhoto: (note: Note | null) => void;
  logout: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addResult: (result: TestResult) => void;
  addExplanation: (testId: string, questionId: string, explanation: string) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  deleteChatMessage: (id: string) => void;
  clearChatHistory: () => void;
  cleanupOldChatHistory: () => void;
  toggleStarQuestion: (question: Question) => void;
  updateStreak: () => void;
  setLastAnalyzedPhotoContext: (context: { name: string; summary: string; timestamp: string } | null) => void;
  setLastUploadedPhotoName: (name: string | null) => void;
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
      lastAnalyzedPhotoContext: null,
      lastUploadedPhotoName: null,
      activeTab: 'home',
      preloadedAIPhoto: null,

      setUser: (user) => set({ user }),
      setFullState: (data) => set((state) => ({ ...state, ...data })),
      logout: () => set({ user: null, results: [], notes: [], starredQuestions: [], chatHistory: [], streak: 0 }),
      setTheme: (theme) => set({ theme }),
      addResult: (result) => set((state) => {
        const next = [...state.results, { ...result, explanations: {} }];
        if (state.user) dataSync.saveResult(state.user.uid, result);
        return { results: next };
      }),
      addExplanation: (testId, questionId, explanation) => set((state) => {
        const updatedResults = state.results.map((r) => r.id === testId ? { ...r, explanations: { ...r.explanations, [questionId]: explanation } } : r);
        const target = updatedResults.find(r => r.id === testId);
        if (state.user && target) dataSync.saveResult(state.user.uid, target);
        return { results: updatedResults };
      }),
      addNote: (note) => set((state) => {
        if (state.user) dataSync.saveNote(state.user.uid, note);
        return { notes: [...state.notes, note] };
      }),
      updateNote: (note) => set((state) => {
        const next = state.notes.map(n => n.id === note.id ? note : n);
        if (state.user) dataSync.saveNote(state.user.uid, note);
        return { notes: next };
      }),
      deleteNote: (id) => set((state) => {
        if (state.user) dataSync.deleteNote(state.user.uid, id);
        return { notes: state.notes.filter(n => n.id !== id) };
      }),
      addChatMessage: (msg) => set((state) => {
        if (state.user) dataSync.saveChatMessage(state.user.uid, msg);
        return { chatHistory: [...state.chatHistory, msg] };
      }),
      deleteChatMessage: (id) => set((state) => {
        if (state.user) dataSync.deleteChatMessage(state.user.uid, id);
        return { chatHistory: state.chatHistory.filter(m => m.id !== id) };
      }),
      clearChatHistory: () => set((state) => {
        if (state.user) dataSync.clearChatHistory(state.user.uid);
        return { chatHistory: [] };
      }),
      cleanupOldChatHistory: () => {
        const state = get();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Only cleanup cloud, keep local state intact per user request
        if (state.user) {
          dataSync.cleanupOldChatHistory(state.user.uid, thirtyDaysAgo.toISOString());
        }
      },
      toggleStarQuestion: (question) => set((state) => {
        const exists = state.starredQuestions.find((q) => q.id === question.id);
        if (exists) {
            if (state.user) dataSync.removeStarredQuestion(state.user.uid, question.id);
            return { starredQuestions: state.starredQuestions.filter((q) => q.id !== question.id) };
        }
        if (state.user) dataSync.saveStarredQuestion(state.user.uid, question);
        return { starredQuestions: [...state.starredQuestions, { ...question, isImportance: true }] };
      }),
      updateStreak: () => {
        // Streak follows the same 1 AM IST academic reset
        const academicDate = getISTAcademicDate();
        const todayId = academicDate.toDateString();
        const lastDate = get().lastLoginDate;
        if (lastDate !== todayId) {
          const newStreak = get().streak + 1;
          const userId = get().user?.uid;
          if (userId) dataSync.saveProfile(userId, newStreak, todayId);
          set({
            streak: newStreak,
            lastLoginDate: todayId
          });
        }
      },
      setLastAnalyzedPhotoContext: (context) => set({ lastAnalyzedPhotoContext: context }),
      setLastUploadedPhotoName: (name) => set({ lastUploadedPhotoName: name }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setPreloadedAIPhoto: (note) => set({ preloadedAIPhoto: note }),
    }),
    {
      name: 'neet-prep-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Helper to get the Academic Date for IST (Indian Standard Time).
 * The day shifts at 1:00 AM IST instead of midnight.
 */
export const getISTAcademicDate = () => {
  const now = new Date();
  // UTC (now) + 5.5 hours (IST) - 1 hour (reset boundary) = +4.5 hours from UTC
  const academicOffsetMs = 4.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + academicOffsetMs);
};

// Helper to get daily chapters
export const getDailyChapters = (dateInput?: Date) => {
  const date = dateInput || getISTAcademicDate();
  const seed = date.getUTCDate() + (date.getUTCMonth() * 31) + (date.getUTCFullYear() * 366);
  
  const getIndex = (arrLength: number, offset: number) => {
    return (seed + offset) % arrLength;
  };

  const isSunday = date.getUTCDay() === 0;

  return {
    isSunday,
    chapters: {
      Physics: ALL_CHAPTERS.Physics[getIndex(ALL_CHAPTERS.Physics.length, 0)],
      Chemistry: ALL_CHAPTERS.Chemistry[getIndex(ALL_CHAPTERS.Chemistry.length, 10)],
      Biology: ALL_CHAPTERS.Biology[getIndex(ALL_CHAPTERS.Biology.length, 20)],
    }
  };
};
