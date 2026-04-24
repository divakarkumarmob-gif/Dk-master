import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Sparkles, X, Zap, Mic, Send, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';

export const DKLive: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showLabel, setShowLabel] = useState(true);
  const [side, setSide] = useState<'left' | 'right'>('left');
  const [isDragging, setIsDragging] = useState(false);
  const labelTimer = useRef<NodeJS.Timeout | null>(null);
  
  const constraintsRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const bubbleRef = useRef<HTMLButtonElement>(null);

  // Initial label timeout
  useEffect(() => {
    labelTimer.current = setTimeout(() => {
      setShowLabel(false);
    }, 2000);
    return () => {
      if (labelTimer.current) clearTimeout(labelTimer.current);
    };
  }, []);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsTyping(true);
    setResponse(null);
    try {
      const res = await geminiService.solveDoubt(query);
      setResponse(res);
    } catch (error) {
      setResponse("Neural signal lost. Synchronizing with tactical uplink.");
    } finally {
      setIsTyping(false);
      setQuery("");
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setShowLabel(true);
    if (labelTimer.current) clearTimeout(labelTimer.current);
  };

  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false);
    
    // Reset timer to hide label after drag ends
    if (labelTimer.current) clearTimeout(labelTimer.current);
    labelTimer.current = setTimeout(() => {
      setShowLabel(false);
    }, 2000);

    // Always snap to left side
    setSide('left');
    
    controls.start({
      x: 0,
      transition: { type: 'spring', stiffness: 400, damping: 40 }
    });
  };

  // Set initial position and label auto-hide
  useEffect(() => {
    controls.set({ x: 0 });
    
    if (labelTimer.current) clearTimeout(labelTimer.current);
    labelTimer.current = setTimeout(() => {
      setShowLabel(false);
    }, 2000);

    return () => {
      if (labelTimer.current) clearTimeout(labelTimer.current);
    };
  }, [controls]);

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[100] p-4 bottom-[72px]">
      <motion.div 
        drag
        dragConstraints={constraintsRef}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="absolute bottom-20 left-4 pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        <div className={cn(
          "flex flex-col items-center gap-3",
          side === 'left' ? "items-start" : "items-end"
        )}>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 40, x: side === 'left' ? 20 : -20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 40, x: side === 'left' ? 20 : -20 }}
                className={cn(
                  "w-[300px] max-w-[calc(100vw-48px)] bg-slate-900 border border-white/20 rounded-[28px] shadow-2xl overflow-hidden flex flex-col mb-4",
                  side === 'left' ? "origin-bottom-left" : "origin-bottom-right"
                )}
              >
                {/* Header */}
                <div className="p-4 border-b border-white/5 bg-slate-800 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-orange-accent/15 flex items-center justify-center text-orange-accent">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-tight text-white">DK Live Assistant</h3>
                      <div className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                          <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-500">Uplink Active</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Interaction Area */}
                <div className="flex-1 min-h-[120px] max-h-[300px] overflow-y-auto p-4 space-y-4">
                  {!response && !isTyping && (
                    <div className="text-center py-6 opacity-40">
                      <Mic className="mx-auto text-orange-accent mb-2" size={32} />
                      <p className="text-[9px] font-black uppercase tracking-widest text-white">Awaiting Commands</p>
                    </div>
                  )}

                  {isTyping && (
                    <div className="flex items-start gap-2">
                      <div className="bg-slate-800 p-2.5 rounded-2xl rounded-tl-none border border-white/5">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-orange-accent/40 rounded-full animate-bounce" />
                            <div className="w-1 h-1 bg-orange-accent/40 rounded-full animate-bounce delay-75" />
                            <div className="w-1 h-1 bg-orange-accent/40 rounded-full animate-bounce delay-150" />
                        </div>
                      </div>
                    </div>
                  )}

                  {response && !isTyping && (
                    <div className="flex items-start gap-2">
                      <div className="bg-slate-800 p-3.5 rounded-2xl rounded-tl-none border border-white/5 shadow-sm">
                        <p className="text-xs font-bold leading-relaxed text-slate-300">{response}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleQuery} className="p-4 pt-1 border-t border-white/5">
                  <div className="relative">
                    <input 
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Broadcast Query..."
                      className="w-full bg-slate-800 p-3 pl-4 pr-10 rounded-2xl text-[10px] font-black uppercase tracking-tight focus:outline-none border-2 border-transparent focus:border-orange-accent transition-all text-white"
                    />
                    <button 
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-orange-accent text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Trigger Area */}
          <div className="group relative flex items-center gap-3">
            {/* Name Label */}
            <AnimatePresence>
                {showLabel && !isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
                        className={cn(
                          "bg-slate-900 border border-white/10 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md",
                          side === 'left' ? "order-2" : "order-1"
                        )}
                    >
                        DK LIVE
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bubble Button */}
            <motion.button
              ref={bubbleRef}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onPointerDown={() => {
                setShowLabel(true);
                if (labelTimer.current) clearTimeout(labelTimer.current);
              }}
              onPointerUp={() => {
                if (labelTimer.current) clearTimeout(labelTimer.current);
                labelTimer.current = setTimeout(() => {
                  setShowLabel(false);
                }, 2000);
              }}
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "relative w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 transition-transform",
                side === 'left' ? "order-1" : "order-2"
              )}
            >
              {/* RGB Periphery Animation */}
              <div className="absolute inset-[-4px] rounded-full overflow-hidden opacity-80 group-hover:opacity-100">
                <div className="absolute inset-0 animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]" />
              </div>

              {/* Inner Circle with Gradient */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-900 via-purple-700 to-pink-800 flex items-center justify-center border-2 border-white/20">
                {isOpen ? (
                  <X size={24} className="text-white" />
                ) : (
                  <div className="relative">
                    <Mic size={28} className="text-white" />
                    <Sparkles size={14} className="text-white absolute -top-1 -right-1 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              {!isOpen && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 z-20" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

