import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dna, 
  Atom, 
  FlaskConical, 
  Sparkles, 
  X, 
  Terminal,
  Zap,
  Target,
  Trophy,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { geminiService, safeJsonParse } from '../services/gemini';
import { cn } from '../lib/utils';
import Confetti from 'react-confetti';
import { Spinner } from './Spinner';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const RapidFireQuiz: React.FC = () => {
    // ... no changes to state ...
  const { theme } = useAppStore();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currIdx, setCurrIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const startQuiz = async () => {
    setLoading(true);
    setQuizFinished(false);
    setScore(0);
    setCurrIdx(0);
    setSelectedOption(null);
    setShowExplanation(false);

    try {
      const prompt = `Act as an extreme NEET examiner. Generate 5 rapid-fire, high-difficulty MCQ questions for biology, physics, and chemistry (NEET level). 
      Format: JSON array of objects { question, options: [4 strings], answer: 0-3 index, explanation: 1 short sentence }.
      Questions should be tricky. Plain text only.`;
      
      const response = await geminiService.solveDoubt(prompt);
      if (response && typeof response === 'string') {
        const parsed = safeJsonParse(response, []);
        if (parsed && parsed.length > 0) {
            setQuestions(parsed);
        } else {
            throw new Error("No valid questions in AI response");
        }
      } else {
          // AI Fallback if result isn't what we expect
          const { FALLBACK_QUESTIONS } = await import('../constants/fallbackData');
          const mapped = FALLBACK_QUESTIONS.map(q => ({
              question: q.text,
              options: q.options,
              answer: q.correctAnswer,
              explanation: q.explanation
          }));
          setQuestions(mapped);
      }
    } catch (e) {
      console.error(e);
      // Hard fallback
      const { FALLBACK_QUESTIONS } = await import('../constants/fallbackData');
      const mapped = FALLBACK_QUESTIONS.map(q => ({
          question: q.text,
          options: q.options,
          answer: q.correctAnswer,
          explanation: q.explanation
      }));
      setQuestions(mapped);
    }
    setLoading(false);
  };

  const handleAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(true);
    
    if (idx === questions[currIdx].answer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currIdx + 1 < questions.length) {
      setCurrIdx(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
      if (score >= 4) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  };

  return (
    <div className="space-y-4">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} gravity={0.3} />}
      
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && questions.length === 0) startQuiz();
        }}
        className="bg-zinc-950 p-6 rounded-[32px] text-white shadow-xl shadow-black/20 relative overflow-hidden cursor-pointer border border-white/5"
      >
        <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={20} className="text-emerald-400" />
                    Rapid Fire Arena
                </h3>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter italic">
                    {isOpen ? 'Abort Operation' : 'Real-time NEET MCQ Warfare'}
                </p>
            </div>
            <Dna size={40} className={cn("opacity-20 animate-pulse transition-transform duration-500", isOpen ? "scale-125 text-emerald-400" : "")} />
        </div>
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {loading ? (
                <div className="p-16 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-[32px] border border-line dark:border-white/5 shadow-inner">
                    <Spinner size={40} label="Decrypting Test Vectors..." />
                </div>
            ) : quizFinished ? (
                <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-[32px] border border-line dark:border-white/5 space-y-6">
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full mx-auto flex items-center justify-center">
                        <Trophy size={40} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-text-main dark:text-white uppercase tracking-tight">Quiz Terminated</h4>
                        <p className="text-sm font-bold text-text-muted">Precision Score: <span className="text-emerald-500">{score}/{questions.length}</span></p>
                    </div>
                    <button 
                        onClick={startQuiz}
                        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Re-Engage Target
                    </button>
                </div>
            ) : questions.length > 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-line dark:border-white/5 p-6 space-y-6 shadow-sm">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                             NEET Challenge {currIdx + 1}/{questions.length}
                        </span>
                        <div className="h-1.5 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${((currIdx + 1) / questions.length) * 100}%` }}
                                className="h-full bg-emerald-500"
                            />
                        </div>
                    </div>

                    <h4 className="text-sm font-bold text-text-main dark:text-white leading-relaxed font-display">
                        {questions[currIdx].question}
                    </h4>

                    <div className="grid gap-3">
                        {questions[currIdx].options.map((opt, i) => {
                            const isCorrect = i === questions[currIdx].answer;
                            const isSelected = selectedOption === i;
                            
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    className={cn(
                                        "w-full p-4 rounded-2xl text-left text-xs font-bold transition-all border",
                                        selectedOption === null 
                                            ? "border-line dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5" 
                                            : isCorrect 
                                                ? "bg-emerald-500 border-emerald-500 text-white scale-[1.02]" 
                                                : isSelected 
                                                    ? "bg-red-500 border-red-500 text-white" 
                                                    : "opacity-40 border-line dark:border-white/5"
                                    )}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence>
                        {showExplanation && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-emerald-500/30"
                            >
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed italic">
                                    <Sparkles size={12} className="inline mr-1" />
                                    {questions[currIdx].explanation}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {selectedOption !== null && (
                        <button 
                            onClick={nextQuestion}
                            className="w-full py-4 bg-text-main dark:bg-white dark:text-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                        >
                            Commit & Next
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
