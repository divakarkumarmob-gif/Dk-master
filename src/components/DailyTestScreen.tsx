import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Send,
  Loader2,
  Brain
} from 'lucide-react';
import { useAppStore, Question, TestResult } from '../store/useAppStore';
import { cn, formatTime } from '../lib/utils';
import { geminiService } from '../services/gemini';
import confetti from 'canvas-confetti';

interface TestProps {
  testConfig: { 
    id: string; 
    type: 'Minor' | 'Major'; 
    subject?: string; 
    chapter?: string; 
    isErrorFix?: boolean;
    questions?: Question[];
  };
  onBack: () => void;
}

export default function DailyTestScreen({ testConfig, onBack }: TestProps) {
  const { addResult, toggleStarQuestion, starredQuestions, theme } = useAppStore();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [submitted, setSubmitted] = useState(false);
  const [showResultMsg, setShowResultMsg] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initTest = async () => {
      try {
        let generatedQuestions: Question[] = [];
        if (testConfig.questions && testConfig.questions.length > 0) {
          generatedQuestions = testConfig.questions;
          setTimeLeft(generatedQuestions.length * 2 * 60); // 2 mins per question
        } else if (testConfig.isErrorFix) {
          const { mistakeVault } = useAppStore.getState();
          const weakConcepts = mistakeVault.slice(-15).map(q => `${q.subject}: ${q.chapter}`).join(', ');
          generatedQuestions = await geminiService.generateErrorFixQuestions(weakConcepts, 20);
          setTimeLeft(25 * 60); // 25 mins
        } else if (testConfig.type === 'Minor') {
          generatedQuestions = await geminiService.generateQuestions(testConfig.subject!, testConfig.chapter!, 30);
          setTimeLeft(30 * 60); // 30 mins
        } else {
          // Major test
          const bio = await geminiService.generateQuestions('Biology', 'Full Syllabus', 90);
          const phy = await geminiService.generateQuestions('Physics', 'Full Syllabus', 45);
          const chem = await geminiService.generateQuestions('Chemistry', 'Full Syllabus', 45);
          generatedQuestions = [...phy, ...chem, ...bio];
          setTimeLeft(180 * 60); // 180 mins
        }
        
        // Ensure strictly formatted questions
        const sanitized = generatedQuestions.map((q, i) => ({
          ...q,
          id: `q-${i}-${Date.now()}`,
          subject: q.subject || (testConfig.subject as any) || 'General',
          chapter: q.chapter || (testConfig.chapter as any) || 'General'
        }));

        setQuestions(sanitized);
        setUserAnswers(new Array(sanitized.length).fill(null));
        setLoading(false);
      } catch (e) {
        console.error("Failed to generate questions", e);
        // Fallback or error UI
        onBack();
      }
    };

    initTest();
  }, [testConfig]);

  useEffect(() => {
    if (!loading && !submitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, submitted, timeLeft]);

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = optionIdx;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (submitted) return;
    const { addToMistakeVault } = useAppStore.getState();
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score and collect mistakes
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    const mistakes: Question[] = [];

    questions.forEach((q, idx) => {
      if (userAnswers[idx] === null) {
        unattempted++;
      } else if (userAnswers[idx] === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
        mistakes.push(q);
      }
    });

    // Save mistakes to vault
    if (mistakes.length > 0) {
      addToMistakeVault(mistakes);
    }

    const totalMarks = (correct * 4) - (wrong * 1);

    const result: TestResult = {
      id: testConfig.id,
      type: testConfig.type,
      subject: testConfig.subject,
      chapter: testConfig.chapter,
      score: totalMarks,
      totalQuestions: questions.length,
      correct,
      wrong,
      unattempted,
      timestamp: new Date().toISOString(),
      questions: questions,
      userAnswers: userAnswers,
      explanations: {}
    };

    addResult(result);
    
    if (correct >= 25 || (testConfig.type === 'Major' && totalMarks > 550)) {
       confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF8C00', '#556B2F', '#ffffff']
      });
    }

    setShowResultMsg(true);
  };

  const isStarred = (q: Question) => starredQuestions.some(sq => sq.text === q.text);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-warm p-10 space-y-6 text-center">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-20 h-20 bg-olive-primary rounded-2xl flex items-center justify-center text-white"
        >
          <Brain size={40} />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text-main">Architecture Intelligence</h2>
          <p className="text-[11px] uppercase tracking-widest font-bold text-text-muted">Constructing your precision test...</p>
        </div>
        <Loader2 className="animate-spin text-orange-accent" />
      </div>
    );
  }

  if (showResultMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-warm p-6 space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-[#E8E8E1] text-olive-primary rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-sm">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-display font-bold text-olive-primary">Test Complete</h2>
          <p className="text-sm font-medium text-text-muted">Analysis protocol will be unlocked in 2 minutes.</p>
        </div>
        
        <div className="w-full max-w-xs space-y-4">
          <div className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border border-line">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Coverage</span>
            <span className="font-black text-olive-primary">{userAnswers.filter(a => a !== null).length} / {questions.length}</span>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="w-full max-w-xs bg-olive-primary text-white py-4 rounded-xl font-bold shadow-lg uppercase text-xs tracking-widest"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className={cn("min-h-screen bg-bg-warm dark:bg-[#0A0A0A] flex flex-col pb-32", theme === 'dark' && "dark")}>
      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl border border-line dark:border-white/10"
            >
              <div className="w-16 h-16 bg-orange-accent/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="text-orange-accent" size={32} />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-display font-black text-olive-dark dark:text-white uppercase tracking-tight">Pause Protocol?</h3>
                <p className="text-sm text-text-muted dark:text-zinc-500 font-medium px-4">Do you wish to submit your current progress or continue the architecture initialization?</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowExitModal(false);
                    handleSubmit();
                  }}
                  className="w-full py-4 bg-orange-accent text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-accent/20 active:scale-[0.98] transition-transform"
                >
                  Submit & Finish
                </button>
                <button 
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-4 bg-bg-warm dark:bg-zinc-800 text-olive-primary dark:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-line dark:border-white/5 active:scale-[0.98] transition-transform"
                >
                  Continue Test
                </button>
                <button 
                  onClick={onBack}
                  className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-text-muted dark:text-zinc-500 opacity-50 hover:opacity-100 transition-opacity"
                >
                  Exit Without Saving
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-center sticky top-0 bg-bg-warm/90 dark:bg-zinc-900/90 backdrop-blur-md z-10 border-b border-black/5 dark:border-white/10">
        <button 
          onClick={() => {
            if (!submitted && !loading) {
              setShowExitModal(true);
            } else {
              onBack();
            }
          }} 
          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-line dark:border-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={20} className="text-olive-primary dark:text-white" />
        </button>
        <div className="text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted dark:text-zinc-500 italic">{testConfig.type} PROTOCOL</p>
          <p className="text-base font-black text-text-main dark:text-white flex items-center gap-2 justify-center">
            <Clock size={16} className={cn(timeLeft < 300 && "text-orange-accent animate-pulse")} />
            {formatTime(timeLeft)}
          </p>
        </div>
        <button 
          onClick={() => toggleStarQuestion(currentQuestion)}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
            isStarred(currentQuestion) 
              ? "bg-orange-accent border-orange-accent text-white" 
              : "bg-white dark:bg-zinc-800 border-line dark:border-white/10 text-text-muted dark:text-zinc-500"
          )}
        >
          <Star size={18} fill={isStarred(currentQuestion) ? "currentColor" : "none"} />
        </button>
      </header>

      {/* Progress Bar */}
      <div className="px-6 pt-6 flex gap-1 h-1.5 opacity-40">
        <div className="w-full bg-[#D6D6CF] dark:bg-zinc-800 rounded-full h-full overflow-hidden">
          <motion.div 
            className="h-full bg-olive-primary dark:bg-orange-accent"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="px-6 py-2 text-right">
        <span className="text-[10px] font-bold text-text-muted dark:text-zinc-500 uppercase tracking-widest">
          Inquiry {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 px-6 py-2 overflow-y-auto">
        <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <h3 className="text-lg font-bold leading-relaxed text-text-main dark:text-white font-display">
              {currentQuestion.text}
            </h3>

            <div className="grid gap-3">
              {currentQuestion.options.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(idx)}
                  className={cn(
                    "p-5 rounded-2xl text-left font-bold transition-all border-2 flex items-center gap-4 shadow-sm",
                    userAnswers[currentIndex] === idx 
                      ? "bg-white dark:bg-zinc-800 border-orange-accent text-orange-accent ring-4 ring-orange-accent/5" 
                      : "bg-white dark:bg-zinc-900 border-line dark:border-white/5 text-text-main dark:text-zinc-300"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors",
                    userAnswers[currentIndex] === idx ? "bg-orange-accent text-white" : "bg-[#E8E8E1] dark:bg-zinc-800 text-text-muted dark:text-zinc-500"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-[14px] leading-snug">{option}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm p-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 flex gap-2 z-[50] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
        <button
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex-1 py-3.5 rounded-2xl font-bold bg-white dark:bg-zinc-800 text-olive-primary dark:text-white border border-line dark:border-white/5 disabled:opacity-30 uppercase text-[9px] tracking-widest shadow-sm active:scale-95 transition-transform"
        >
          Previous
        </button>
        
        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="flex-[2] py-3.5 rounded-2xl font-bold bg-orange-accent text-white shadow-lg shadow-orange-accent/30 uppercase text-[9px] tracking-widest active:scale-95 transition-transform"
          >
            Finalize Test
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="flex-[2] py-3.5 rounded-2xl font-bold bg-olive-primary text-white shadow-lg uppercase text-[9px] tracking-widest active:scale-95 transition-transform"
          >
            Next Inquiry
          </button>
        )}
      </div>
    </div>
  );
}
