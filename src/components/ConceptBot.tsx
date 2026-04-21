import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  Loader2, 
  FileText, 
  Zap, 
  AlertCircle, 
  Copy, 
  Check,
  Search,
  ChevronDown,
  Info
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { useAppStore, Note } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface CheatSheet {
    concept: string;
    formulas: string[];
    mnemonics: string;
    traps: string[];
    summary: string;
}

export const ConceptBot: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CheatSheet | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const { addNote } = useAppStore();

  const generateSheet = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setData(null);
    setSaved(false);
    try {
      const prompt = `Act as an elite NEET ranker. Create a "Combat Cheat Sheet" for the concept: "${input}". 
      Focus on high-yield information and quick recall. 
      Format strictly as a JSON object: 
      { 
        "concept": "concept name", 
        "formulas": ["form 1", "form 2"], 
        "mnemonics": "one great memory trick", 
        "traps": ["trap 1", "trap 2"], 
        "summary": "1-2 line master summary" 
      }
      Include 2-3 formulas and 2 exam traps. Use Hinglish if it helps the mnemonic.`;
      
      const response = await geminiService.solveDoubt(prompt);
      if (response) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            setData(JSON.parse(jsonMatch[0]));
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSaveToVault = () => {
    if (!data) return;
    const newNote: Note = {
      id: `cheat-${Date.now()}`,
      name: data.concept,
      description: `Cheat Sheet for ${data.concept}`,
      aiSummary: JSON.stringify(data),
      timestamp: new Date().toISOString()
    };
    addNote(newNote);
    setSaved(true);
  };

  const handleCopy = () => {
    if (!data) return;
    const text = `Concept: ${data.concept}\n\nFormulas:\n${data.formulas.join('\n')}\n\nMnemonic: ${data.mnemonics}\n\nExam Traps:\n${data.traps.join('\n')}\n\nSummary: ${data.summary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Zap size={18} />
        </div>
        <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Cheat-Sheet Bot</h3>
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter opacity-60">Instant Concept Blueprints</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center text-emerald-500/40 group-focus-within:text-emerald-400 transition-colors">
            <Search size={18} />
        </div>
        <input 
            type="text"
            placeholder="Enter Chapter/Concept (e.g. Capacitor, Krebes Cycle...)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateSheet()}
            className="w-full pl-12 pr-14 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-xs font-bold text-white placeholder:text-zinc-600 focus:ring-2 ring-emerald-500/50 outline-none transition-all shadow-xl"
        />
        <button 
            onClick={generateSheet}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-500 disabled:opacity-30 transition-all shadow-inner"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      <AnimatePresence>
        {data && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-zinc-900 border border-emerald-500/20 rounded-[32px] overflow-hidden shadow-2xl"
            >
                {/* Visual Header */}
                <div className="p-4 bg-emerald-600/10 border-b border-emerald-500/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FileText size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Tactical Blueprint</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={saved}
                            onClick={handleSaveToVault}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest",
                                saved ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-zinc-400 hover:text-white"
                            )}
                        >
                            {saved ? <Check size={12} /> : <Zap size={12} />}
                            {saved ? 'Saved' : 'Save to Vault'}
                        </button>
                        <button 
                            onClick={handleCopy}
                            className="p-2 hover:bg-white/5 rounded-lg text-emerald-400 transition-colors"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Concept Title */}
                    <div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{data.concept}</h4>
                        <div className="w-12 h-1 bg-emerald-500 rounded-full mt-2"></div>
                    </div>

                    {/* Master Formulas */}
                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Master Formulas</p>
                        <div className="grid gap-2">
                            {data.formulas.map((f, i) => (
                                <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl font-mono text-xs text-emerald-300">
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cheat Code Mnemonic */}
                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                         <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-2">
                            <Sparkles size={12} />
                            Memory Cheat Code
                         </p>
                         <p className="text-[11px] font-bold text-white italic tracking-wide">
                            {data.mnemonics}
                         </p>
                    </div>

                    {/* Exam Traps */}
                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                            <AlertCircle size={12} />
                            Critical Exam Traps
                        </p>
                        <div className="space-y-2">
                            {data.traps.map((t, i) => (
                                <div key={i} className="flex gap-3 text-[11px] font-medium text-zinc-400">
                                    <span className="text-red-500 font-bold">•</span>
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] font-bold text-zinc-500 italic">
                             &ldquo;{data.summary}&rdquo;
                        </p>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-4 opacity-40">
        <Info size={12} className="text-white" />
        <p className="text-[8px] font-bold uppercase tracking-widest text-white">AI-synthesized revision guide</p>
      </div>
    </div>
  );
};
