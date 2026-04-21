import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useAppStore, TestResult } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { ChevronRight, Filter, TrendingUp, AlertCircle, Info, Brain, CheckCircle2, Sparkles, Loader2, Clock, Star, Flame, Zap, History as HistoryIcon } from 'lucide-react';
import { geminiService } from '../services/gemini';
import { formatTime } from '../lib/utils';
import { MistakeVault } from './MistakeVault';
import { SmartFlashcards } from './SmartFlashcards';
import { RankPredictor } from './RankPredictor';

const AnalysisScreen: React.FC = () => {
  const { results, theme } = useAppStore();
  const [filter, setFilter] = useState<'All' | 'Minor' | 'Major'>('All');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [view, setView] = useState<'archives' | 'vault'>('archives');

  const filteredResults = useMemo(() => {
    return results
      .filter(r => filter === 'All' || r.type === filter)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [results, filter]);

  const chartData = useMemo(() => {
    return results
      .slice(-7)
      .map(r => ({
        date: format(new Date(r.timestamp), 'dd/MM'),
        score: r.score
      }));
  }, [results]);

  const generateAIAnalysis = async () => {
    if (results.length === 0) return;
    setLoadingAi(true);
    try {
      const perfString = results.map(r => `${r.type} ${r.subject || 'Full'}: ${r.correct}/${r.totalQuestions}`).join(', ');
      const plan = await geminiService.getStudyPlan(perfString);
      setAiAnalysis(plan);
    } catch (e) {
      console.error(e);
    }
    setLoadingAi(false);
  };

  if (selectedResult) {
    return <ResultDetail result={selectedResult} onBack={() => setSelectedResult(null)} />;
  }

  return (
    <div className="space-y-8 py-6 pb-20">
      <div className={cn("px-2 flex justify-between items-center", theme === 'dark' && "text-white")}>
        <h2 className="text-xl font-display font-black text-olive-dark dark:text-white tracking-tight uppercase">
            {view === 'archives' ? 'Performance Hub' : 'Galti Sudhar Zone'}
        </h2>
        <div className="flex bg-[#E8E8E1] dark:bg-zinc-800 p-1 rounded-xl shadow-inner">
            <button 
                onClick={() => setView('archives')}
                className={cn(
                    "px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all duration-300",
                    view === 'archives' ? "bg-white dark:bg-zinc-700 shadow-md scale-105" : "opacity-40"
                )}
            >
                <HistoryIcon size={14} className={view === 'archives' ? "text-olive-primary" : ""} />
                <span className="text-[8px] font-black uppercase tracking-widest text-text-main dark:text-white">Archives</span>
            </button>
            <button 
                onClick={() => setView('vault')}
                className={cn(
                    "px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all duration-300",
                    view === 'vault' ? "bg-orange-accent shadow-md scale-105" : "opacity-40"
                )}
            >
                <Flame size={14} className={view === 'vault' ? "text-white" : ""} />
                <span className={cn("text-[8px] font-black uppercase tracking-widest", view === 'vault' ? "text-white" : "text-text-main dark:text-white")}>Vault</span>
            </button>
        </div>
      </div>

      {view === 'vault' ? (
        <div className="px-2">
            <MistakeVault />
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="px-2 pb-2">
            <RankPredictor />
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-line dark:border-white/10 mx-2">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-accent" />
                <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted dark:text-zinc-500 italic">Statistical Trajectory</h3>
              </div>
              <div className="flex bg-[#E8E8E1] dark:bg-zinc-800 p-1 rounded-xl">
                {(['All', 'Minor', 'Major'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                      filter === f 
                        ? "bg-white dark:bg-zinc-700 text-olive-primary dark:text-white shadow-sm" 
                        : "text-text-muted dark:text-zinc-500 opacity-50"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" fontSize={8} axisLine={false} tickLine={false} stroke="#7E7E7A" dy={10} />
                  <YAxis fontSize={8} axisLine={false} tickLine={false} stroke="#7E7E7A" dx={-10} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid rgba(0,0,0,0.05)', 
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      fontSize: '10px',
                      fontWeight: '800',
                      textTransform: 'uppercase'
                    }}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="score" 
                    stroke="#FF6321" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#FF6321', strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-olive-primary to-olive-dark p-6 rounded-2xl space-y-4 shadow-xl shadow-olive-primary/20 text-white mx-2 relative overflow-hidden">
             <div className="relative z-10">
               <div className="flex justify-between items-center mb-2">
                <h3 className="font-display font-black text-sm flex items-center gap-2 uppercase tracking-widest">
                  <Brain size={18} className="text-orange-accent" />
                  Smarter AI Plan
                </h3>
                {!aiAnalysis && (
                  <button 
                    onClick={generateAIAnalysis}
                    disabled={loadingAi}
                    className="text-[9px] bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    {loadingAi ? 'Calibrating...' : 'Initialize'}
                  </button>
                )}
              </div>
              {aiAnalysis ? (
                <div className="text-xs prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed opacity-80 font-medium bg-black/10 p-4 rounded-xl">
                  {aiAnalysis}
                </div>
              ) : (
                <p className="text-[11px] opacity-60 italic font-serif leading-relaxed">Let architecture intelligence evaluate your performance and construct a personalized refinement strategy.</p>
              )}
             </div>
             <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="space-y-4 px-2">
            <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted px-4 italic">Neural Reinforcement</h3>
            <SmartFlashcards />
          </div>

           <div className="space-y-4 pt-4">
            <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted px-4 italic">Operational Archives</h3>
            <div className="grid gap-4 px-2">
              {filteredResults.map((r) => (
                <HistoryCard 
                  key={r.id} 
                  result={r} 
                  onOpen={setSelectedResult}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 space-y-4 opacity-50">
          <div className="w-16 h-16 bg-[#E8E8E1] rounded-2xl mx-auto flex items-center justify-center text-text-muted">
            <AlertCircle size={32} />
          </div>
          <p className="text-[10px] uppercase font-black tracking-widest">No Operational Data Detected</p>
        </div>
      )}
    </div>
  );
}

const HistoryCard: React.FC<{ result: TestResult, onOpen: (r: TestResult) => void }> = ({ result, onOpen }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCurrentlyLocked, setIsCurrentlyLocked] = useState(true);

  useEffect(() => {
    const calculateTime = () => {
      const lockStartTime = new Date(result.timestamp).getTime();
      const lockEndTime = lockStartTime + (2 * 60 * 1000);
      const diff = Math.floor((lockEndTime - Date.now()) / 1000);
      const remaining = Math.max(0, diff);
      setTimeLeft(remaining);
      setIsCurrentlyLocked(remaining > 0);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [result.timestamp]);

  return (
    <motion.div
      whileTap={isCurrentlyLocked ? {} : { scale: 0.98 }}
      onClick={() => !isCurrentlyLocked && onOpen(result)}
      className={cn(
        "bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center justify-between cursor-pointer border-l-[6px] shadow-sm transition-all border dark:border-white/5",
        isCurrentlyLocked ? "border-l-orange-accent opacity-90 shadow-inner bg-orange-accent/[0.02]" : "border-l-olive-primary"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-tight transition-colors",
          isCurrentlyLocked ? "bg-zinc-200 dark:bg-zinc-800 text-text-muted" : (result.type === 'Major' ? "bg-orange-accent text-white" : "bg-olive-primary text-white")
        )}>
          {result.type === 'Major' ? 'MJR' : 'MNR'}
        </div>
        <div>
          <p className="text-sm font-bold text-text-main dark:text-white">{result.type} Test: {result.subject || 'Final'}</p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-text-muted dark:text-zinc-500 font-bold uppercase tracking-wider">{format(new Date(result.timestamp), 'dd MMM • hh:mm a')}</p>
            {isCurrentlyLocked && (
              <div className="flex items-center gap-1 bg-orange-accent animate-pulse px-1.5 py-0.5 rounded text-white transform scale-90">
                <Clock size={8} />
                <span className="text-[8px] font-black">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex items-center gap-2">
        <div>
          <p className={cn(
            "text-base font-black transition-colors",
            isCurrentlyLocked ? "text-text-muted opacity-40" : "text-olive-primary dark:text-white"
          )}>{result.score}</p>
          <p className="text-[9px] text-text-muted dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Marks</p>
        </div>
        {isCurrentlyLocked ? (
          <div className="relative">
            <div className="absolute inset-0 bg-orange-accent rounded-full animate-ping opacity-20" />
            <Clock size={14} className="text-orange-accent relative z-10" />
          </div>
        ) : (
          <ChevronRight size={14} className="text-text-muted" />
        )}
      </div>
    </motion.div>
  );
}

function ResultDetail({ result, onBack }: { result: TestResult, onBack: () => void }) {
  const { theme, addExplanation, toggleStarQuestion, starredQuestions } = useAppStore();
  const [qFilter, setQFilter] = useState<'All' | 'Correct' | 'Wrong' | 'Skipped'>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});

  const explainQuestion = async (q: any) => {
    setGenerating(prev => ({ ...prev, [q.id]: true }));
    try {
      const explanation = await geminiService.solveDoubt(`Explain why correct answer of this question is ${q.options[q.correctAnswer]} and why the user choice was wrong. Question: ${q.text}. Be concise.`);
      if (explanation) {
        addExplanation(result.id, q.id, explanation);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(prev => ({ ...prev, [q.id]: false }));
  };

  const filteredQuestions = useMemo(() => {
    return result.questions.map((q, idx) => ({ ...q, originalIndex: idx }))
      .filter((q) => {
        const uAns = result.userAnswers[q.originalIndex];
        if (qFilter === 'All') return true;
        if (qFilter === 'Correct') return uAns === result.questions[q.originalIndex].correctAnswer;
        if (qFilter === 'Wrong') return uAns !== null && uAns !== result.questions[q.originalIndex].correctAnswer;
        if (qFilter === 'Skipped') return uAns === null;
        return true;
      });
  }, [result, qFilter]);

  const currentQ = filteredQuestions[currentIndex];

  useEffect(() => {
    setCurrentIndex(0);
  }, [qFilter]);

  return (
    <div className={cn("fixed inset-0 bg-bg-warm dark:bg-[#0A0A0A] z-[100] flex flex-col animate-in slide-in-from-right duration-300", theme === 'dark' && "dark")}>
      <header className="flex items-center gap-4 py-5 bg-bg-warm/95 dark:bg-zinc-900/95 backdrop-blur-md z-[70] px-6 border-b border-black/5 dark:border-white/10 shrink-0">
        <button onClick={onBack} className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-line dark:border-white/10 flex items-center justify-center transform active:scale-95 transition-transform">
          <ChevronRight className="rotate-180 text-olive-primary dark:text-white" size={20} />
        </button>
        <div>
          <h2 className="font-display font-black text-lg text-olive-dark dark:text-white tracking-tight uppercase">Analysis Protocol</h2>
          <p className="text-[9px] uppercase tracking-widest font-black text-text-muted dark:text-zinc-500 italic">{result.type} • {result.subject || 'Full Syllabus'}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-40">
        <div className="px-6 py-6 space-y-8">
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Correct" value={result.correct} color="text-[#4CAF50] bg-white dark:bg-zinc-900 border border-line dark:border-white/10" />
            <StatBox label="Inaccurate" value={result.wrong} color="text-orange-accent bg-white dark:bg-zinc-900 border border-line dark:border-white/10" />
            <StatBox label="Bypassed" value={result.unattempted} color="text-text-muted dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-line dark:border-white/10" />
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <h3 className="font-display font-black text-sm uppercase tracking-widest text-olive-dark dark:text-white opacity-80">Inquiry Review</h3>
              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {(['All', 'Correct', 'Wrong', 'Skipped'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setQFilter(f)}
                    className={cn(
                      "whitespace-nowrap text-[8px] font-black uppercase px-4 py-2 rounded-md border transition-all",
                      qFilter === f ? "bg-olive-primary text-white border-olive-primary shadow-md" : "bg-white dark:bg-zinc-900 text-text-muted dark:text-zinc-500 border-line dark:border-white/10 opacity-60"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              {currentQ ? (
                <motion.div 
                  key={`${qFilter}-${currentIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-zinc-900 p-6 rounded-2xl space-y-5 border border-line dark:border-white/10 shadow-sm relative"
                >
                <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-3">
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarQuestion(currentQ);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all border",
                          starredQuestions.some(sq => sq.text === currentQ.text)
                            ? "bg-orange-accent border-orange-accent text-white" 
                            : "bg-white dark:bg-zinc-800 border-line dark:border-white/10 text-text-muted dark:text-zinc-500 hover:border-orange-accent/50"
                        )}
                      >
                        <Star size={14} fill={starredQuestions.some(sq => sq.text === currentQ.text) ? "currentColor" : "none"} />
                      </button>
                      <span className="text-[9px] font-black italic text-text-muted dark:text-zinc-500 uppercase tracking-[0.2em]">Inquiry ID-{currentQ.originalIndex + 1}</span>
                   </div>
                  <span className="text-[10px] font-black text-olive-primary dark:text-white opacity-60">{currentIndex + 1} of {filteredQuestions.length}</span>
                </div>
                
                <p className="font-display font-black text-base leading-relaxed text-text-main dark:text-white">{currentQ.text}</p>
                
                <div className="grid gap-2">
                  {currentQ.options.map((opt, oIdx) => {
                    const userAns = result.userAnswers[currentQ.originalIndex];
                    const isCorrectOption = oIdx === currentQ.correctAnswer;
                    const isSelectedWrong = userAns === oIdx && !isCorrectOption;
                    
                    return (
                      <div 
                        key={oIdx}
                        className={cn(
                          "p-4 rounded-xl text-[13px] font-bold border-2 transition-all flex items-center justify-between",
                          isCorrectOption ? "bg-[#4CAF50]/5 border-[#4CAF50] text-[#4CAF50]" :
                          isSelectedWrong ? "bg-orange-accent/5 border-orange-accent text-orange-accent" : "bg-bg-warm dark:bg-white/5 border-transparent text-text-muted/60 dark:text-zinc-400"
                        )}
                      >
                         <div className="flex items-center gap-3">
                           <span className={cn(
                             "w-6 h-6 rounded-md flex items-center justify-center text-[10px] uppercase font-black",
                             isCorrectOption ? "bg-[#4CAF50] text-white" :
                             isSelectedWrong ? "bg-orange-accent text-white" : "bg-[#D6D6CF] dark:bg-white/10 text-white"
                           )}>
                             {String.fromCharCode(65 + oIdx)}
                           </span>
                           {opt}
                         </div>
                         {isCorrectOption && <CheckCircle2 size={16} />}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-5 bg-[#F8F8F4] dark:bg-white/5 rounded-xl border border-line/30 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-orange-accent" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40] dark:text-orange-accent">Precision Logic</p>
                  </div>
                  <p className="text-[12px] text-text-main dark:text-zinc-300 leading-relaxed font-serif font-medium opacity-80 italic">{currentQ.explanation}</p>
                </div>
                
                {((result.userAnswers[currentQ.originalIndex] !== currentQ.correctAnswer) || (result.userAnswers[currentQ.originalIndex] === null)) && !result.explanations[currentQ.id] && (
                  <button
                    onClick={() => explainQuestion(currentQ)}
                    disabled={!!generating[currentQ.id]}
                    className="w-full mt-4 py-3 rounded-xl bg-orange-accent text-white text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2"
                  >
                    {generating[currentQ.id] ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                    {generating[currentQ.id] ? 'Generating Logic...' : 'Get AI Explanation'}
                  </button>
                )}
                
                {result.explanations[currentQ.id] && (
                  <div className="mt-4 p-5 bg-orange-accent/5 rounded-xl border border-orange-accent/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-accent mb-2">AI-Powered Insight</p>
                    <p className="text-[12px] text-text-main dark:text-zinc-300 leading-relaxed font-serif font-medium">{result.explanations[currentQ.id]}</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-line dark:border-white/10 opacity-50">
                <p className="text-[10px] font-black uppercase tracking-widest dark:text-white">No matching inquiries found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

{/* Navigation Footer */}
      {filteredQuestions.length > 0 && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm p-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10 flex gap-2 z-[80] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex-1 py-3.5 rounded-2xl font-black bg-bg-warm dark:bg-zinc-800 text-olive-primary dark:text-white border border-line dark:border-white/5 disabled:opacity-30 uppercase text-[9px] tracking-widest shadow-sm active:scale-95 transition-transform"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
            disabled={currentIndex === filteredQuestions.length - 1}
            className="flex-[1.5] py-3.5 rounded-2xl font-black bg-olive-primary text-white shadow-lg shadow-olive-primary/20 uppercase text-[9px] tracking-widest disabled:opacity-30 active:scale-95 transition-transform"
          >
            Next Inquiry
          </button>
        </div>
      )}
    </div>
  );
}

export default AnalysisScreen;

function StatBox({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className={cn("p-4 rounded-3xl text-center space-y-1", color)}>
      <p className="text-2xl font-display font-bold">{value}</p>
      <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">{label}</p>
    </div>
  );
}
