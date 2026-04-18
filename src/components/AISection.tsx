import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, MessageSquare, Send, Loader2, ChevronRight, History, Sparkles, WifiOff, Wifi } from 'lucide-react';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';
import { useAppStore, ChatMessage, getDailyChapters } from '../store/useAppStore';
import Markdown from 'react-markdown';

export const AISection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { chatHistory, addChatMessage, results, streak, user } = useAppStore();
  const [query, setQuery] = useState('');
  const [currentMessages, setCurrentMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSummaryBtn, setShowSummaryBtn] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSend = async (text?: string) => {
    const userMsg = text || query;
    if (!userMsg.trim()) return;
    
    setCurrentMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      text: userMsg,
      timestamp: new Date().toISOString()
    });
    setQuery('');
    setLoading(true);

    // --- LOCAL OFFLINE GATE ---
    const lowerText = userMsg.toLowerCase();
    let localReply = "";

    // App Data Logic
    if (lowerText.includes("score") || lowerText.includes("marks") || lowerText.includes("result")) {
      const avgScore = results.length > 0 
        ? (results.reduce((acc, r) => acc + r.score, 0) / (results.length * 720) * 100).toFixed(1) 
        : 0;
      localReply = results.length === 0 
        ? "Neural Core Report: Abhi tak koi test archives nahi mile hain. Ek Minor test attempt karo level check karne ke liye!"
        : `Archival Data: Aapka average precision ${avgScore}% hai. Aapne total ${results.length} tests complete kiye hain.`;
    } else if (lowerText.includes("history") || lowerText.includes("pichle test")) {
      localReply = `Archives: Aapne ${results.filter(r => r.type === 'Minor').length} Minor aur ${results.filter(r => r.type === 'Major').length} Major tests execute kiye hain. Details Analysis Hub me accessible hain.`;
    } else if (lowerText.includes("study plan") || lowerText.includes("strategy") || lowerText.includes("schedule")) {
      const daily = getDailyChapters(new Date());
      localReply = `Study Strategy: Aaj ka focus ${Object.keys(daily.chapters).join(', ')} par hai. Consistency is key! ${streak} din ki streak break mat hone dena.`;
    } 
    // Basic NEET Concept Shortcuts (Offline)
    else if (lowerText.includes("mitochondria")) {
      localReply = "**Mitochondria**: Known as the powerhouse of the cell. Double-membranous organelle where ATP synthesis occurs via oxidative phosphorylation.";
    } else if (lowerText.includes("photosynthesis")) {
      localReply = "**Photosynthesis**: Process used by plants to convert light energy into chemical energy. Key parts: Light reactions (Thylakoid) and Dark reactions (Stroma/Calvin Cycle).";
    } else if (lowerText.includes("newton") && lowerText.includes("law")) {
      localReply = "**Newton's Laws**: \n1. Law of Inertia. \n2. F = ma. \n3. Action = Reaction.";
    } else if (lowerText.includes("period")) {
      localReply = "**Periodic Table**: Elements are arranged by increasing atomic number. Modern periodic law states properties are periodic functions of atomic numbers.";
    }

    if (isOffline && !localReply) {
      localReply = "Neural Link Offline: Main abhi sirf aapke scores, history, study plans aur basic concepts (like Mitochondria, Newton's laws) ke bare me bata sakta hoon. Full synthesis ke liye network reconnect karein.";
    }

    if (localReply) {
      setTimeout(() => {
        setCurrentMessages(prev => [...prev, { role: 'ai', text: localReply }]);
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: localReply,
          timestamp: new Date().toISOString()
        });
        setLoading(false);
      }, 600);
      return;
    }
    // --- END LOCAL GATE ---

    try {
      const response = await geminiService.solveDoubt(userMsg);
      if (response) {
        setCurrentMessages(prev => [...prev, { role: 'ai', text: response }]);
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: response,
          timestamp: new Date().toISOString()
        });
        setShowSummaryBtn(currentMessages.length + 1);
      }
    } catch (e) {
      setCurrentMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    }
    setLoading(false);
  };

  const handleSummarize = async (text: string) => {
    setLoading(true);
    setShowSummaryBtn(null);
    try {
      const summary = await geminiService.summarizeResponse(text);
      if (summary) {
        const summaryText = `[SUMMARY]: ${summary}`;
        setCurrentMessages(prev => [...prev, { role: 'ai', text: summaryText }]);
        addChatMessage({
          id: Date.now().toString(),
          role: 'ai',
          text: summaryText,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-warm fixed inset-0 z-[60] flex flex-col pt-10 px-6 pb-6 animate-in slide-in-from-bottom duration-300">
      <header className="flex justify-between items-center mb-8 bg-gradient-to-r from-[#2196F3] via-[#9C27B0] to-[#673AB7] p-4 rounded-[24px] shadow-lg border border-white/20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)] rounded-xl flex items-center justify-center text-[#9C27B0]">
              <Brain size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-black text-white font-display text-sm uppercase tracking-[0.1em]">Neural Doubt Solver</h2>
              <div className="flex items-center gap-2">
                <p className="text-[8px] text-white/60 font-black uppercase tracking-widest">Core Synthesis v3.1</p>
                <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                <div className={cn(
                  "flex items-center gap-1 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border",
                  isOffline ? "bg-orange-accent/20 border-orange-accent/30 text-orange-200" : "bg-green-500/20 border-green-500/30 text-green-200"
                )}>
                  {isOffline ? <WifiOff size={8} /> : <Wifi size={8} />}
                  {isOffline ? 'Offline Proxy' : 'Neural Link Active'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            "p-2 rounded-xl border transition-all",
            showHistory ? "bg-white text-[#9C27B0] border-transparent" : "bg-white/10 text-white border-white/20 hover:bg-white/20"
          )}
        >
          <History size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-hide mb-4 pb-4 relative">
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] backdrop-blur-xl z-20 rounded-2xl p-6 overflow-y-auto border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase tracking-widest text-xs text-blue-400">Neural Sync History</h3>
                <button onClick={() => setShowHistory(false)} className="text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors">Close</button>
              </div>
              <div className="space-y-4">
                {chatHistory.length === 0 ? (
                  <p className="text-center py-10 text-[10px] uppercase font-black opacity-30 text-white italic">No archival records detected</p>
                ) : (
                  chatHistory.slice().reverse().map((m, i) => (
                    <div key={m.id} className={cn(
                      "p-3 rounded-xl text-[11px] leading-relaxed border",
                      m.role === 'user' 
                        ? "bg-white/10 text-white border-white/10 ml-6" 
                        : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white/90 border-white/5 mr-6"
                    )}>
                      {m.text}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {currentMessages.length === 0 && (
          <div className="text-center py-20 opacity-30 space-y-4">
            <MessageSquare size={48} className="mx-auto" />
            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Secure Link Established...</p>
          </div>
        )}
        {currentMessages.map((m, i) => (
          <div key={i} className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed",
                m.role === 'user' 
                  ? "bg-gradient-to-r from-olive-primary to-olive-dark text-white ml-auto shadow-md" 
                  : "bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/5 prose prose-invert prose-sm max-w-none shadow-xl"
              )}
            >
              {m.role === 'ai' ? (
                <div className="markdown-body">
                  <Markdown>{m.text}</Markdown>
                </div>
              ) : m.text}
            </motion.div>
            
            {m.role === 'ai' && showSummaryBtn === i && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleSummarize(m.text)}
                className="bg-orange-accent text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-orange-accent/30 mx-auto transform translate-y-[-10px]"
              >
                <Sparkles size={10} />
                Summarize
              </motion.button>
            )}
          </div>
        ))}
        {loading && (
          <div className="bg-gradient-to-r from-[#2196F3] to-[#9C27B0] p-4 rounded-2xl shadow-lg border border-white/10 w-max flex items-center gap-3">
            <Loader2 className="animate-spin text-white" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Processing...</span>
          </div>
        )}
      </div>

      <div className="relative group">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Neural prompt input..."
          className="w-full bg-[#1A1A2E] text-white pl-6 pr-14 py-4 rounded-2xl border border-white/10 focus:border-blue-500 outline-none shadow-lg transition-all text-sm font-medium placeholder:text-white/20"
        />
        <button 
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 shadow-lg transition-transform active:scale-90"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
