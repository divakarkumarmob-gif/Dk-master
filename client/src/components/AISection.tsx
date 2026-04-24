import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, ChevronLeft, Bot, User, Loader2, Sparkle } from 'lucide-react';
import { UnifiedInput } from './UnifiedInput';
import { geminiService } from '../services/gemini';
import { cn } from '../lib/utils';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
}

export const AISection: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string) => {
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            const botAnswer = await geminiService.solveDoubt(text);
            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: botAnswer,
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 text-white flex flex-col z-[500]">
            {/* Tactical Header */}
            <header className="p-4 pt-8 bg-slate-900/50 border-b border-white/10 flex items-center justify-between shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white/60 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-tight">Neural Pulse</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Synchronized</span>
                        </div>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-orange-accent/20 flex items-center justify-center text-orange-accent">
                    <Brain size={20} />
                </div>
            </header>

            {/* Chat Messages */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 scroll-smooth"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-40">
                         <div className="relative">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="w-40 h-40 rounded-full border border-white/5 flex items-center justify-center"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles size={48} className="text-orange-accent animate-pulse" />
                            </div>
                         </div>
                         <div className="text-center space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Cognitive Core Ready</p>
                            <p className="text-xs font-medium max-w-[200px]">How can the neural network assist your strategic objectives today?</p>
                         </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={msg.id}
                            className={cn(
                                "flex items-end gap-3",
                                msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10",
                                msg.sender === 'user' ? "bg-slate-800" : "bg-orange-accent/20 text-orange-accent"
                            )}>
                                {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className={cn(
                                "max-w-[75%] p-4 rounded-3xl text-sm font-bold leading-relaxed shadow-sm",
                                msg.sender === 'user' 
                                    ? "bg-slate-900 border border-white/10 rounded-br-none" 
                                    : "bg-orange-accent/10 text-orange-50 border border-orange-accent/20 rounded-bl-none"
                            )}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))
                )}
                {isTyping && (
                    <div className="flex items-end gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-accent/20 text-orange-accent flex items-center justify-center shrink-0 border border-white/10">
                            <Bot size={14} />
                        </div>
                        <div className="bg-orange-accent/5 p-4 rounded-3xl rounded-bl-none border border-white/5">
                            <Loader2 size={16} className="animate-spin text-orange-accent/60" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Overlay */}
            <div className="p-4 pb-10 bg-slate-950/80 backdrop-blur-md border-t border-white/5">
                <UnifiedInput 
                    onSend={handleSend} 
                    disabled={isTyping} 
                    placeholder="Broadcast to Neural Core..." 
                />
            </div>
        </div>
    );
};
