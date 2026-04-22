import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Settings2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { questionLoader } from '../services/questionLoader';

interface CustomPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: (config: any) => void;
}

export const CustomPracticeModal: React.FC<CustomPracticeModalProps> = ({ isOpen, onClose, onStartTest }) => {
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStart = async (subject: 'Biology' | 'Physics' | 'Chemistry') => {
    setLoading(true);
    try {
      // Fetch directly from your provided data chunks via questionLoader
      const selectedQuestions = await questionLoader.getRandomQuestions(questionCount);
      
      // Map the fetched data (from JSON) directly to the test screen
      const formattedQuestions = selectedQuestions.map((q: any, i: number) => ({
        id: `custom-${subject}-${i}`,
        text: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer || 0,
        explanation: q.explanation || 'No explanation provided.',
        subject: subject,
        chapter: 'Custom Practice'
      }));

      onStartTest({
        id: `custom-${Date.now()}`,
        type: 'Custom',
        subject: subject,
        chapter: 'Custom Practice',
        questions: formattedQuestions
      });

      onClose();
    } catch (error) {
      console.error('Data loading error:', error);
      alert("Questions load karne mein error aaya, check internet or link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 p-6"
      >
        <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <Settings2 size={24} className="text-orange-accent" />
            Custom Practice
        </h2>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="animate-spin text-olive-primary mb-4" size={32} />
                <p className="text-sm font-bold text-text-muted">Loading your questions...</p>
            </div>
        ) : (
            <div className="space-y-6">
                <div className="flex flex-col gap-3">
                    {['Biology', 'Physics', 'Chemistry'].map((sub) => (
                        <button key={sub} onClick={() => handleStart(sub as any)}
                        className="p-4 rounded-xl border-2 border-line hover:border-olive-primary font-bold transition-all">
                            Start {sub} Practice
                        </button>
                    ))}
                </div>
            </div>
        )}
      </motion.div>
    </div>
  );
}

