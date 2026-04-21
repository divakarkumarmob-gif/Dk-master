import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Settings2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { customBank } from '../data/customBank';

interface CustomPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: (config: any) => void;
}

export const CustomPracticeModal: React.FC<CustomPracticeModalProps> = ({ isOpen, onClose, onStartTest }) => {
  const [selectedSubject, setSelectedSubject] = useState<'Biology' | 'Physics' | 'Chemistry' | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);

  if (!isOpen) return null;

  const subjects: ('Physics' | 'Chemistry' | 'Biology')[] = ['Physics', 'Chemistry', 'Biology'];

  const getAvailableQuestions = (sub: 'Physics' | 'Chemistry' | 'Biology') => customBank[sub]?.length || 0;

  const handleStart = () => {
    if (!selectedSubject) return;
    
    // Get questions from bank
    const available = customBank[selectedSubject] || [];
    const countToTake = Math.min(questionCount, available.length, 60);
    
    // Pick random questions or just slice
    const selectedQuestions = [...available].sort(() => 0.5 - Math.random()).slice(0, countToTake);

    // Format them for the test component
    const formattedQuestions = selectedQuestions.map((q, i) => ({
      id: `custom-${selectedSubject}-${i}`,
      text: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      subject: selectedSubject,
      chapter: 'Custom Practice'
    }));

    onStartTest({
      id: `custom-${Date.now()}`,
      type: 'Minor',
      subject: selectedSubject,
      chapter: 'Custom Practice',
      questions: formattedQuestions
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 border border-black/5 dark:border-white/10"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-olive-dark dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Settings2 size={24} className="text-orange-accent" />
              Custom Practice
            </h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#E8E8E1] dark:bg-white/10 flex items-center justify-center text-text-muted dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-text-muted dark:text-gray-400 uppercase tracking-widest mb-3">Select Subject</p>
              <div className="grid grid-cols-1 gap-2">
                {subjects.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={cn(
                      "p-3 rounded-xl text-sm font-bold transition-all border-2 text-left flex justify-between items-center",
                      selectedSubject === sub 
                        ? "border-olive-primary bg-olive-primary/5 text-olive-primary dark:border-emerald-400 dark:bg-emerald-400/10 dark:text-emerald-400" 
                        : "border-[#E8E8E1] dark:border-white/10 text-text-main dark:text-gray-300 hover:border-olive-primary/30"
                    )}
                  >
                    <span>{sub}</span>
                    <span className="text-[10px] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">{getAvailableQuestions(sub)} Qs available</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {selectedSubject && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-text-muted dark:text-gray-400 uppercase tracking-widest">Number of Questions</p>
                      <p className="text-sm font-black text-olive-primary dark:text-emerald-400">{questionCount}</p>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max={Math.min(60, getAvailableQuestions(selectedSubject))} 
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full h-2 bg-[#E8E8E1] dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-olive-primary dark:accent-emerald-400"
                    />
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-[10px] font-bold text-text-muted">1</span>
                      <span className="text-[10px] font-bold text-text-muted">Max {Math.min(60, getAvailableQuestions(selectedSubject))}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStart}
                    className="w-full p-4 rounded-2xl bg-olive-primary dark:bg-emerald-500 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-olive-primary/30 dark:shadow-emerald-500/20"
                  >
                    Start Test ({questionCount} Qs)
                    <Play size={18} fill="currentColor" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
