import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, 
  Trash2, 
  ChevronRight, 
  Sparkles,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAppStore, Note } from '../store/useAppStore';
import { cn } from '../lib/utils';

export const SavedCheatSheets: React.FC = () => {
  const { notes, deleteNote } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter notes that look like cheat sheets (they have aiSummary which is a JSON string of CheatSheet)
  const cheatSheets = notes.filter(n => n.id.startsWith('cheat-'));

  if (cheatSheets.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center border border-amber-500/30">
            <Library size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Saved Tactical Vault</h3>
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter opacity-60">Offline-First AI Notes</p>
          </div>
        </div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            {cheatSheets.length} BLUEPRINTS
        </div>
      </div>

      <div className="space-y-3">
        {cheatSheets.slice().reverse().map((note) => {
          const isExpanded = expandedId === note.id;
          let data = null;
          try {
            data = note.aiSummary ? JSON.parse(note.aiSummary) : null;
          } catch(e) {
            console.error("Failed to parse cheat sheet data", e);
          }

          if (!data) return null;

          return (
            <div 
              key={note.id}
              className={cn(
                "bg-zinc-900 border transition-all duration-300 rounded-[24px] overflow-hidden group",
                isExpanded ? "border-amber-500/30 shadow-2xl shadow-amber-500/10" : "border-white/5 hover:border-white/20"
              )}
            >
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : note.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0",
                        isExpanded ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-white/5 border-white/10 text-zinc-500"
                    )}>
                        <FileText size={18} />
                    </div>
                    <div className="truncate">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">{note.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Clock size={10} className="text-zinc-600" />
                            <span className="text-[8px] font-bold text-zinc-600 uppercase">Saved on {new Date(note.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm("Archive se delete karein?")) deleteNote(note.id);
                        }}
                        className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                    <div className="text-zinc-600">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 space-y-6">
                        <div className="h-px bg-white/5 w-full"></div>
                        
                        {/* Master Formulas */}
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Master Formulas</p>
                            <div className="grid gap-2">
                                {data.formulas.map((f: string, i: number) => (
                                    <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl font-mono text-xs text-amber-300/80">
                                        {f}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mnemonic */}
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-2">
                                <Sparkles size={12} />
                                Memory Cheat Code (Offline)
                            </p>
                            <p className="text-[11px] font-bold text-white italic tracking-wide">
                                {data.mnemonics}
                            </p>
                        </div>

                        {/* Exam Traps */}
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
                                <AlertCircle size={12} />
                                Critical Exam Traps
                            </p>
                            <div className="space-y-2">
                                {data.traps.map((t: string, i: number) => (
                                    <div key={i} className="flex gap-3 text-[11px] font-medium text-zinc-400">
                                        <span className="text-rose-500 font-bold">•</span>
                                        {t}
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
        })}
      </div>

      <div className="px-2 flex items-center gap-2 opacity-40">
          <Library size={10} className="text-amber-500" />
          <p className="text-[8px] font-black uppercase tracking-widest text-white italic">
            Saved blueprints are accessible even without internet.
          </p>
      </div>
    </div>
  );
};
