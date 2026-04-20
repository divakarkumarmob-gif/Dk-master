import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls, useAnimation } from 'motion/react';
import { Mic, MicOff, X, Volume2, Sparkles, Loader2, Trash2, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';
import { useAppStore, getDailyChapters } from '../store/useAppStore';

export const VoiceAI: React.FC = () => {
  const { streak, results, user, addChatMessage, deleteChatMessage, clearChatHistory, chatHistory, lastAnalyzedPhotoContext, lastUploadedPhotoName } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [mode, setMode] = useState<'voice' | 'text' | 'history'>('voice');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const labelTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const controls = useAnimation();
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial position
    controls.set({ x: 20, y: window.innerHeight - 150 });
    return () => {
      if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
    };
  }, [controls]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        setTranscript(text);
        processVoiceCommand(text);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    setResponse('');
    
    // Construct rich context for the AI
    const daily = getDailyChapters();
    const avgScore = results.length > 0 
      ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1) 
      : 0;
    const lastResult = results[results.length - 1];
    
    // --- LOCAL LOGIC GATE (OFFLINE/SPEED) ---
    const lowerText = text.toLowerCase();

    // Summary detection
    if (lowerText === "summary" || lowerText === "summarise") {
      const lastAIResponse = chatHistory.slice().reverse().find(m => m.role === 'ai');
      if (lastAIResponse) {
        setIsProcessing(true);
        setResponse('');
        const summary = await geminiService.summarizeResponse(lastAIResponse.text);
        if (summary) {
          const summaryText = `[SUMMARY]: ${summary}`;
          setResponse(summaryText);
          addChatMessage({ id: Date.now().toString(), role: 'user', text: text, timestamp: new Date().toISOString() });
          addChatMessage({ id: (Date.now() + 1).toString(), role: 'ai', text: summaryText, timestamp: new Date().toISOString() });
          speak(summaryText);
        }
        setIsProcessing(false);
        return;
      }
    }

    let localReply = "";

    if (lowerText.includes("score") || lowerText.includes("marks") || lowerText.includes("result")) {
      if (results.length === 0) {
        localReply = "Abhi tak aapne koi test nahi diya hai. Ek minor test attempt karo, phir main aapka level bata paungi!";
      } else {
        localReply = `Aapka average score ${avgScore}% hai. Aapne total ${results.length} tests diye hain. Pichle test me aapne ${lastResult.score}% score kiya tha.`;
      }
    } else if (lowerText.includes("test history") || lowerText.includes("pichle test")) {
      if (results.length === 0) {
        localReply = "Aapka test history blank hai. Padhai shuru karein!";
      } else {
        localReply = `Aapne ${results.filter(r => r.type === 'Minor').length} Minor aur ${results.filter(r => r.type === 'Major').length} Major tests diye hain. Detailed analysis Analysis tab me dekh sakte hain.`;
      }
    } else if (lowerText.includes("kaise chalaye") || lowerText.includes("how to use") || lowerText.includes("sections")) {
      localReply = "Ye app 4 sections me divided hai: Home me daily targets hain, Analysis me aapki progress, Notes me aapke concepts, aur main (dk live) aapka personal coach hoon. Aap kahin bhi move kar sakte hain mujhe!";
    } else if (lowerText.includes("galti") || lowerText.includes("mistake") || lowerText.includes("improvement")) {
      if (results.length === 0) {
        localReply = "Pehle ek test do, toh main aapki galtiyan analyze kar ke improvement plan bata sakti hoon.";
      } else {
        const wrongCount = lastResult.wrong;
        localReply = `Aapne pichle test me ${wrongCount} questions galat kiye. Inhe Analysis section me re-attempt karke marks sudhar sakte hain.`;
      }
    } else if (
      (lowerText.includes("tumhe") || lowerText.includes("tumhare") || lowerText.includes("tumko") || lowerText.includes("tum")) &&
      (lowerText.includes("kisne") || lowerText.includes("kaun") || lowerText.includes("owner") || lowerText.includes("kiske")) &&
      (lowerText.includes("banaya") || lowerText.includes("malik") || lowerText.includes("owner") || lowerText.includes("boss"))
    ) {
      localReply = "Mujhe Mister DK ne banaya hai. Kya aap unse baat karna chahte hain? Unki Insta ID mr.divakar00 hai, ya aap settings me help section me ja sakte hain.";
    }

    if (localReply) {
      setResponse(localReply);
      addChatMessage({ id: Date.now().toString(), role: 'user', text: text, timestamp: new Date().toISOString() });
      addChatMessage({ id: (Date.now() + 1).toString(), role: 'ai', text: localReply, timestamp: new Date().toISOString() });
      speak(localReply);
      setIsProcessing(false);
      return;
    }
    // --- END LOCAL LOGIC ---

    const appContext = `
      USER: ${user?.email} | STREAK: ${streak} | AVG: ${avgScore}%
      RECENT_ANALYSIS: ${lastAnalyzedPhotoContext ? `${lastAnalyzedPhotoContext.name}: ${lastAnalyzedPhotoContext.summary}` : 'None'}
      RECENT_UPLOAD: ${lastUploadedPhotoName || 'None'}
      TEST: ${lastResult ? `${lastResult.subject} - ${lastResult.score}%` : 'None'}
      TARGETS: ${Object.entries(daily.chapters).map(([s, c]) => `${s}:${c}`).join(', ')}
      
      APP_MANUAL:
      - App Name: NEET Prep Master
      - Sections: Home (Daily targets), AI Solver (Doubts), Analysis (Stats), Vault (Notes/Starred).
      - Test System: Minor (Chapter wise), Major (Full Sunday tests).
      - Marks Improvement: AI analyzes patterns in Analysis tab to suggest weak topics.
    `;

    try {
      const aiResponse = await geminiService.solveDoubt(text, appContext);
      setResponse(aiResponse);
      addChatMessage({ id: Date.now().toString(), role: 'user', text: text, timestamp: new Date().toISOString() });
      addChatMessage({ id: (Date.now() + 1).toString(), role: 'ai', text: aiResponse, timestamp: new Date().toISOString() });
      speak(aiResponse);
    } catch (e) {
      console.error(e);
      setResponse("Kuch error aa gaya hai, please thoda wait karke try karo!");
    }
    setIsProcessing(false);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1; // Slightly faster for human feel
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN'; // Indian English/Hinglish feel
      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setResponse('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const closePortal = () => {
    setIsOpen(false);
    setIsListening(false);
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
  };

  const openPortal = () => {
    setIsOpen(true);
    setMode('voice'); // Explicitly reset to voice on every open
    // Start listening automatically in voice mode
    setTimeout(() => {
        toggleListening();
    }, 500);
  };

  const handleDragEnd = (_: any, info: any) => {
    const screenWidth = window.innerWidth;
    const snapX = info.point.x > screenWidth / 2 ? screenWidth - 75 : 15;
    controls.start({
      x: snapX,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    });
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[90]" ref={constraintsRef}>
      <div className="relative w-full h-full">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.05}
              dragMomentum={false}
              animate={controls}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
              className="absolute pointer-events-auto touch-none flex items-center"
              style={{ x: 20, y: window.innerHeight - 150, zIndex: 100 }}
            >
              <AnimatePresence>
                {showLabel && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-full ml-3 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 whitespace-nowrap"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-white italic">dk live</span>
                    <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-black/80"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onPointerDown={() => {
                  setShowLabel(true);
                  if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
                }}
                onPointerUp={() => {
                  labelTimerRef.current = setTimeout(() => setShowLabel(false), 5000);
                }}
                onPointerLeave={() => {
                  if (showLabel && !labelTimerRef.current) {
                    labelTimerRef.current = setTimeout(() => setShowLabel(false), 5000);
                  }
                }}
                onClick={() => setIsOpen(true)}
                className="relative group w-14 h-14"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#2196F3] via-[#9C27B0] to-[#673AB7] rounded-full blur-md opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-125 opacity-50"></div>
                
                <div className="relative w-full h-full rounded-full flex items-center justify-center border border-white/30 overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
                  <div className="absolute top-2 right-2"><Sparkles size={8} className="text-white animate-pulse" /></div>
                  <div className="absolute bottom-2 left-2"><Sparkles size={6} className="text-white/80 animate-ping" /></div>
                  <Mic className="text-white relative z-10" size={24} />
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-white/10 p-6 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-72 space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#9C27B0]/20 blur-[60px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#2196F3]/20 blur-[60px] rounded-full"></div>
                
                {/* Golden Animated Stars Background */}
                <div className="absolute inset-0 z-0 opacity-40 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-yellow-400"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      initial={{ scale: 0.2, opacity: 0 }}
                      animate={{ scale: [0.5, 1, 0.5], opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.5 + Math.random() * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles size={8 + Math.random() * 8} />
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-between items-center relative z-10 p-1">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1.5 rounded-full border border-white/10">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_#2196F3]"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white italic">dk live</span>
                  </div>
                  <button onClick={closePortal} className="text-[#7E7E7A] hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Toggle UI */}
                <div className="flex bg-white/10 p-1 rounded-full mb-4 relative z-10">
                  {['voice', 'text', 'history'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m as 'voice' | 'text' | 'history')}
                      className={cn(
                        "flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-full transition-all",
                        mode === m ? "bg-white text-blue-900" : "text-white/50"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="min-h-[140px] flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                  {mode === 'voice' ? (
                    isListening ? (
                    // ... (keep existing voice listening UI)
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-16 h-16 bg-gradient-to-br from-[#2196F3] to-[#9C27B0] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(33,150,243,0.4)]"
                      >
                        <Mic className="text-white" size={32} />
                      </motion.div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-4 animate-pulse uppercase">Link Energized...</p>
                    </div>
                  ) : isProcessing ? (
                    <div className="space-y-4">
                      <Loader2 className="animate-spin text-purple-400 mx-auto" size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Scanning Neural Core...</p>
                    </div>
                  ) : transcript ? (
                    <div className="w-full space-y-3 px-2">
                       <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1 text-left opacity-50">Transcribed</p>
                        <p className="text-xs font-bold text-white/80 italic text-left line-clamp-2">"{transcript}"</p>
                      </div>
                      <div className="h-px bg-white/5 w-1/2 mx-auto"></div>
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-h-[160px] overflow-y-auto pr-2 custom-scrollbar text-sm font-display font-medium text-white leading-relaxed text-left"
                      >
                        {response}
                      </motion.div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <Sparkles size={32} className="text-blue-400 mx-auto animate-pulse" />
                        <motion.div 
                           animate={{ rotate: 360 }}
                           transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                           className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full scale-150"
                        />
                      </div>
                      <p className="text-xs font-bold text-white/70">
                        Hello! Main aapki progress aur doubts sab jaanta hoon. Kuch help chahiye?
                      </p>
                    </div>
                  )
                  ) : mode === 'text' ? (
                    // Text Mode
                    <div className="w-full space-y-3">
                      <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type doubt..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs h-20"
                      />
                      <button 
                        onClick={() => processVoiceCommand(textInput)}
                        className="w-full bg-blue-500 py-2 rounded-xl text-white text-xs font-bold uppercase"
                      >
                        Submit Query
                      </button>
                    </div>
                  ) : (
                    // History Mode
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Neural Logs</p>
                        {chatHistory.length > 0 && (
                          <button 
                            onClick={() => {
                              if (window.confirm("Format all neural logs?")) {
                                clearChatHistory();
                              }
                            }}
                            className="text-[9px] font-black uppercase text-orange-accent hover:opacity-80 transition-opacity"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div className="w-full h-[180px] overflow-y-auto space-y-3 p-2 custom-scrollbar">
                        {chatHistory.length === 0 ? <p className="text-white/50 text-xs text-center">No history yet</p> : chatHistory.slice().reverse().map((h) => (
                          <div key={h.id} className="text-left bg-white/5 p-2 rounded-xl text-xs space-y-1 group relative">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Archive log delete karein?")) {
                                  if (h.id) {
                                    deleteChatMessage(h.id);
                                  }
                                }
                              }}
                              className="absolute -top-1 -right-1 p-2 bg-orange-accent text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl z-[30] cursor-pointer active:scale-90"
                            >
                              <Trash2 size={10} />
                            </button>
                            <p className="font-bold text-blue-300 uppercase">{h.role}</p>
                            <p className="text-white/80">{h.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {mode === 'voice' && (
                    <button
                      onClick={toggleListening}
                      disabled={isProcessing}
                      className={cn(
                        "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 relative z-10",
                        isListening
                          ? "bg-white text-[#16213E] shadow-xl"
                          : "bg-gradient-to-r from-[#2196F3] to-[#9C27B0] text-white shadow-lg shadow-purple-500/20 border border-white/10"
                      )}
                    >
                      {isListening ? (
                        <>
                          <MicOff size={18} />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <Mic size={18} />
                          Establish Link
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
