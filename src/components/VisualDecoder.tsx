import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Search, 
  Loader2, 
  Tag as TagIcon, 
  HelpCircle, 
  BookOpen,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { cn } from '../lib/utils';

interface DiagramData {
    name: string;
    labels: string[];
    functions: Record<string, string>;
    pastQuestions: string[];
    ncertReference: string;
}

export const VisualDecoder: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DiagramData | null>(null);

  const decodeDiagram = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setData(null);
    try {
      const prompt = `Act as a Senior NEET Biology/Physics Expert. Analyze the standard NCERT diagram: "${input}".
      Format strictly as a JSON object:
      {
        "name": "diagram name",
        "labels": ["Label 1", "Label 2", "Label 3"],
        "functions": { "Label 1": "short function", "Label 2": "short function" },
        "pastQuestions": ["Ex: In NEET 2021, asked about...", "Ex: Identifying label X..."],
        "ncertReference": "Chapter name and approximate location"
      }
      Focus on high-yield labels only.`;
      
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center shrink-0 border border-blue-500/30">
            <Eye size={18} />
        </div>
        <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Visual Decoder</h3>
            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter opacity-60">NCERT Diagram Analyzer</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center text-blue-500/40 group-focus-within:text-blue-400 transition-colors">
            <ImageIcon size={18} />
        </div>
        <input 
            type="text"
            placeholder="Diagram Name (e.g. Structure of DNA, Heart...)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && decodeDiagram()}
            className="w-full pl-12 pr-14 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-xs font-bold text-white placeholder:text-zinc-600 focus:ring-2 ring-blue-500/50 outline-none transition-all shadow-xl"
        />
        <button 
            onClick={decodeDiagram}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-30 transition-all shadow-inner"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </div>

      <AnimatePresence>
        {data && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-zinc-900 border border-blue-500/20 rounded-[32px] overflow-hidden shadow-2xl"
            >
                <div className="p-4 bg-blue-600/10 border-b border-blue-500/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{data.ncertReference}</span>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{data.name}</h4>
                        <div className="w-12 h-1 bg-blue-500 rounded-full mt-2"></div>
                    </div>

                    {/* Labels & Functions */}
                    <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Labels & Critical Functions</p>
                        <div className="grid gap-3">
                            {data.labels.map((label, i) => (
                                <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-xl group/label hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-white">{label}</p>
                                        <p className="text-[11px] font-medium text-zinc-400 leading-relaxed italic">{data.functions[label] || "Key structural component"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Past NEET Qs */}
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                         <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                            <HelpCircle size={12} />
                            PYQ Insights
                         </p>
                         <div className="space-y-3">
                            {data.pastQuestions.map((q, i) => (
                                <div key={i} className="flex gap-2 text-[11px] font-bold text-white/80">
                                    <span className="text-indigo-500 opacity-60">Q.</span>
                                    {q}
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
