import React, { useState, useRef } from 'react';
import { Plus, Smile, Send, Camera, Image, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface UnifiedInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const UnifiedInput: React.FC<UnifiedInputProps> = ({ onSend, placeholder = "Ask something...", disabled }) => {
  const [text, setText] = useState("");
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText("");
    }
  };

  return (
    <div className="flex items-center gap-3 w-full max-w-2xl mx-auto px-4 py-2">
      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} className="hidden" onChange={() => setShowPlusMenu(false)} />
      <input type="file" accept="image/*" ref={photoInputRef} className="hidden" onChange={() => setShowPlusMenu(false)} />
      <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={() => setShowPlusMenu(false)} />

      <div className="flex-1 bg-slate-900/50 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[40px] px-6 py-4 flex items-center gap-4 border border-white/10 shadow-2xl relative">
        {/* Plus Button and Menu */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <Plus size={24} className={cn("transition-transform duration-300", showPlusMenu && "rotate-45")} />
          </button>
          
          <AnimatePresence>
            {showPlusMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: -10, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full left-0 mb-4 bg-zinc-900 border border-white/10 rounded-3xl p-3 shadow-2xl z-50 min-w-[160px]"
              >
                <PlusMenuItem icon={<Camera size={18} />} label="Camera" onClick={() => cameraInputRef.current?.click()} />
                <PlusMenuItem icon={<Image size={18} />} label="Photo" onClick={() => photoInputRef.current?.click()} />
                <PlusMenuItem icon={<FileText size={18} />} label="Files" onClick={() => fileInputRef.current?.click()} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <input 
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-white text-lg font-medium placeholder:text-white/40"
        />

        {/* Emoji Button */}
        <button 
          type="button"
          className="text-white/60 hover:text-white transition-colors"
        >
          <Smile size={24} />
        </button>
      </div>

      {/* Send Button */}
      <button 
        onClick={() => handleSubmit()}
        disabled={!text.trim() || disabled}
        className={cn(
          "w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all bg-[#A8C7FA] text-[#001D35] shadow-xl active:scale-90",
          (!text.trim() || disabled) && "opacity-50 grayscale"
        )}
      >
        <Send size={24} className="-rotate-12 translate-y-0.5" />
        <span className="text-[10px] font-bold mt-0.5">SMS</span>
      </button>
    </div>
  );
};

const PlusMenuItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-2xl transition-colors text-white/80 hover:text-white text-sm font-bold uppercase tracking-widest"
  >
    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
      {icon}
    </div>
    {label}
  </button>
);
