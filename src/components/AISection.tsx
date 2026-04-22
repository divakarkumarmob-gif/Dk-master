import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, MessageSquare, Send, Loader2, ChevronRight, History, Sparkles, WifiOff, Wifi, Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';
import { useAppStore, ChatMessage, getDailyChapters } from '../store/useAppStore';
import Markdown from 'react-markdown';

export const AISection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { 
    chatHistory, 
    addChatMessage, 
    deleteChatMessage,
    clearChatHistory,
    results, 
    streak, 
    user, 
    lastAnalyzedPhotoContext, 
    lastUploadedPhotoName,
    preloadedAIPhoto,
    setPreloadedAIPhoto,
    updateNote,
    addNote
  } = useAppStore();
  const [query, setQuery] = useState('');
  const [currentMessages, setCurrentMessages] = useState<{ id: string, role: 'user' | 'ai', text: string, type?: 'summary', image?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSummaryBtn, setShowSummaryBtn] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [selectedImage, setSelectedImage] = useState<string | null>(preloadedAIPhoto?.photo || null);
  const [activeSessionImage, setActiveSessionImage] = useState<string | null>(preloadedAIPhoto?.photo || null);
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);

  // If a photo is preloaded, clear it when we leave the section
  const handleBack = () => {
    setPreloadedAIPhoto(null);
    onBack();
  };

  useEffect(() => {
    if (preloadedAIPhoto) {
      const img = preloadedAIPhoto.photo || null;
      setSelectedImage(img);
      setActiveSessionImage(img);
    }
  }, [preloadedAIPhoto]);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setActiveSessionImage(base64);
        setTempImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (text?: string) => {
    const userMsg = text || query || '';
    const capturedImage = selectedImage;
    
    // If we have a preloaded photo and user just clicks send (no text), it's a "Scan"
    const isScanRequest = preloadedAIPhoto && !userMsg.trim();
    const finalMsg = isScanRequest ? "Detailed scan and explain this image." : userMsg;

    if (!finalMsg.trim() && !capturedImage) return;
    
    const displayMsg = isScanRequest ? "Neural Scan initiated..." : (userMsg || (capturedImage ? "Neural analysis of image..." : ""));

    const userMsgId = Date.now().toString();
    setCurrentMessages(prev => [...prev, { id: userMsgId, role: 'user', text: displayMsg, image: capturedImage || undefined }]);
    addChatMessage({
      id: userMsgId,
      role: 'user',
      text: displayMsg + (capturedImage ? " [IMAGE ATTACHED]" : ""),
      timestamp: new Date().toISOString()
    });
    setQuery('');
    setLoading(true);
    setSelectedImage(null); // Clear preview but keep activeSessionImage

    // --- LOCAL OFFLINE GATE ---
    const lowerText = finalMsg.toLowerCase();

    // Check for summary keywords (only for text)
    if (!selectedImage && (lowerText === "summary" || lowerText === "summarise")) {
      const lastAIResponse = [...currentMessages].reverse().find(m => m.role === 'ai');
      if (lastAIResponse) {
        handleSummarize(lastAIResponse.text);
        setLoading(false);
        return;
      }
    }

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
      const daily = getDailyChapters();
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
      localReply = "Neural Link Offline: Main abhi sirf aapke scores, history, study plans aur basic concepts (like Mitochondria, Newton's laws) ke bare me bata sakta hoon. Image analysis ke liye network jaroori hai.";
    }

    if (localReply) {
      setTimeout(() => {
        const aiMsgId = (Date.now() + 1).toString();
        setCurrentMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: localReply }]);
        addChatMessage({
          id: aiMsgId,
          role: 'ai',
          text: localReply,
          timestamp: new Date().toISOString()
        });
        setLoading(false);
      }, 600);
      setSelectedImage(null);
      setTempImageFile(null);
      return;
    }
    // --- END LOCAL GATE ---

    try {
      let imageData;
      if (capturedImage) {
        imageData = {
          data: capturedImage.split(',')[1],
          mimeType: "image/png"
        };
      }

      const response = await geminiService.solveDoubt(
        userMsg, 
        (lastAnalyzedPhotoContext || lastUploadedPhotoName) ? 
          `Recent context: ${lastAnalyzedPhotoContext ? `Last ANALYZED photo: "${lastAnalyzedPhotoContext.name}" (Summary: ${lastAnalyzedPhotoContext.summary})` : ''} 
           ${lastUploadedPhotoName ? `Last UPLOADED photo name: "${lastUploadedPhotoName}"` : ''}` : undefined, 
        imageData
      );
      if (response) {
        const aiMsgId = (Date.now() + 1).toString();
        setCurrentMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: response || "Analysis complete." }]);
        addChatMessage({
          id: aiMsgId,
          role: 'ai',
          text: response || "Analysis complete.",
          timestamp: new Date().toISOString()
        });
        setShowSummaryBtn(currentMessages.length + 1);
      }
    } catch (e) {
      setCurrentMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: "Neural Link Latency: I'm having trouble connecting right now. Please practice NCERT while I re-sync." }]);
    }
    setLoading(false);
    setTempImageFile(null);
  };

  const handleSummarize = async (text: string) => {
    setLoading(true);
    setShowSummaryBtn(null);
    try {
      const summary = await geminiService.summarizeResponse(text);
      if (summary) {
        const summaryText = summary;
        const summaryId = Date.now().toString();
        setCurrentMessages(prev => [...prev, { id: summaryId, role: 'ai', text: summaryText, type: 'summary' }]);
        addChatMessage({
          id: summaryId,
          role: 'ai',
          text: `[SUMMARY]: ${summaryText}`,
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
          <button onClick={handleBack} className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all">
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
                <div className="flex items-center gap-4">
                  {chatHistory.length > 0 && (
                    <button 
                      onClick={() => {
                        if (window.confirm("Archival logs permanently format karna chahte hain?")) {
                          clearChatHistory();
                        }
                      }}
                      className="text-[10px] font-black uppercase text-orange-accent hover:opacity-80 transition-opacity"
                    >
                      Delete All
                    </button>
                  )}
                  <button onClick={() => setShowHistory(false)} className="text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors">Close</button>
                </div>
              </div>
              <div className="space-y-4">
                {chatHistory.length === 0 ? (
                  <p className="text-center py-10 text-[10px] uppercase font-black opacity-30 text-white italic">No archival records detected</p>
                ) : (
                  chatHistory.slice().reverse().map((m, i) => (
                    <div key={m.id} className={cn(
                      "p-3 rounded-xl text-[11px] leading-relaxed border group relative",
                      m.role === 'user' 
                        ? "bg-white/10 text-white border-white/10 ml-6" 
                        : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white/90 border-white/5 mr-6"
                    )}>
                      {m.text}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Archive log delete karein?")) {
                            if (m.id) {
                              deleteChatMessage(m.id);
                            }
                          }
                        }}
                        className="absolute -top-3 -right-3 p-2 bg-orange-accent text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl z-[30] cursor-pointer active:scale-90"
                      >
                        <Trash2 size={12} />
                      </button>
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
          <div key={m.id} className="space-y-2 group relative">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed relative",
                m.role === 'user' 
                  ? "bg-gradient-to-r from-olive-primary to-olive-dark text-white ml-auto shadow-md" 
                  : "bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-white/5 prose prose-invert prose-sm max-w-none shadow-xl"
              )}
            >
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Conversation segment delete karein?")) {
                    if (m.id) {
                      deleteChatMessage(m.id);
                      setCurrentMessages(prev => prev.filter(msg => msg.id !== m.id));
                    }
                  }
                }}
                className={cn(
                  "absolute -top-3 p-2 bg-orange-accent/90 backdrop-blur-md rounded-full text-white shadow-xl transition-all opacity-0 group-hover:opacity-100 z-[30] cursor-pointer active:scale-90",
                  m.role === 'user' ? "-left-3" : "-right-3"
                )}
              >
                <Trash2 size={12} />
              </button>
              
              {m.image && (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                  <img src={m.image} alt="Sent" className="w-full h-auto max-h-48 object-cover" />
                </div>
              )}
              {m.role === 'ai' ? (
                <div className="markdown-body">
                  <Markdown>{m.text}</Markdown>
                </div>
              ) : m.text}

              {/* Individual Delete for current session items if they have an ID (which they don't yet in currentMessages array unless synced) */}
              {/* Wait, currentMessages in state doesn't have IDs usually. Let's find by content or just use index? No, we should sync IDs. */}
            </motion.div>
            
            {/* Added delete for main view too if possible, but currentMessages is just session. 
                Actually, most users want to delete from history. 
                I will skip delete for current session 'currentMessages' as it's ephemeral until refresh. 
            */}
            
            {m.role === 'ai' && m.type === 'summary' && activeSessionImage && (
              <div className="flex flex-col gap-2 w-full max-w-[90%] mx-auto mt-2">
                 <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-[10px] text-blue-300 flex items-center gap-2">
                    <Sparkles size={12} />
                    <span>Summary complete. You can now save it to your note archives.</span>
                 </div>
                 <button 
                  onClick={() => {
                    if (preloadedAIPhoto) {
                      const existingDesc = preloadedAIPhoto.description ? preloadedAIPhoto.description + "\n\n" : "";
                      updateNote({
                        ...preloadedAIPhoto,
                        description: existingDesc + "[AI SUMMARY]: " + m.text
                      });
                    } else {
                      // create auto note
                      addNote({
                        id: Date.now().toString(),
                        name: `Neural Note - ${new Date().toLocaleTimeString()}`,
                        photo: activeSessionImage || '',
                        description: `[AI SUMMARY]: ${m.text}`,
                        timestamp: new Date().toISOString(),
                        keywords: 'Neural AI, Scan'
                      });
                    }
                    const confirmMsg = "Summary successfully archivalized to your note archives.";
                    setCurrentMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: confirmMsg }]);
                    setActiveSessionImage(null); // prevent duplicate saves
                  }}
                  className="w-full py-3 bg-[#4CAF50] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                >
                  Save to Note Archive
                </button>
              </div>
            )}
            
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

      {selectedImage && (
        <div className="px-6 mb-2">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 shadow-lg">
            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => { setSelectedImage(null); setTempImageFile(null); }}
              className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="relative group">
        <input 
          type="file" 
          id="ai-photo-upload" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageSelect}
        />
        <label 
          htmlFor="ai-photo-upload"
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <Camera size={20} />
        </label>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask something or upload photo..."
          className="w-full bg-[#1A1A2E] text-white pl-12 pr-14 py-4 rounded-2xl border border-white/10 focus:border-blue-500 outline-none shadow-lg transition-all text-sm font-medium placeholder:text-white/20"
        />
        <button 
          onClick={() => handleSend()}
          disabled={loading || (!query.trim() && !selectedImage)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center disabled:opacity-30 shadow-lg transition-transform active:scale-90"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
