import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Scan, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle,
  X,
  FileSearch,
  Search
} from 'lucide-react';
import { geminiService } from '../services/gemini';
import { Question } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface QuestionScannerProps {
  onStartTest: (questions: Question[]) => void;
}

export const QuestionScanner: React.FC<QuestionScannerProps> = ({ onStartTest }) => {
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedQuestions, setScannedQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setScannedQuestions([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScan = async () => {
    if (!image) return;
    setScanning(true);
    setError(null);
    try {
      const extracted = await geminiService.extractQuestionsFromImage(image);
      if (extracted && extracted.length > 0) {
        setScannedQuestions(extracted);
      } else {
        setError("No clear questions detected. Ek baar NCERT page ki clear photo khichiye.");
      }
    } catch (e) {
      console.error(e);
      setError("AI Scan failed. Please check your internet connection.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 text-blue-500 rounded-lg flex items-center justify-center border border-blue-500/30">
            <Scan size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">External Question Scanner</h3>
            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter opacity-60">NCERT & Module Digitizer</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            <Sparkles size={10} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 tracking-tighter uppercase">AI OCR</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-6 space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] rounded-full pointer-events-none"></div>

        {!image ? (
            <div className="grid grid-cols-2 gap-4">
                <button 
                    className="aspect-square bg-blue-600/10 border-2 border-blue-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-blue-500 transition-all hover:bg-blue-600/20"
                    onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.capture = "environment"; // Try to force camera on some mobile browsers
                        input.onchange = (e) => handleFileChange(e as any);
                        input.click();
                    }}
                >
                    <Camera size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Camera</span>
                </button>
                <button 
                    className="aspect-square bg-purple-600/10 border-2 border-purple-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-purple-500 transition-all hover:bg-purple-600/20"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FileSearch size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Files</span>
                </button>
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </div>
        ) : (
            <div className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
                    <img src={image} alt="Target" className="w-full h-full object-cover opacity-60" />
                    <button 
                        onClick={() => { setImage(null); setScannedQuestions([]); setError(null); }}
                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg hover:bg-black transition-colors"
                    >
                        <X size={16} />
                    </button>
                    {scanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                            <Loader2 className="text-blue-500 animate-spin mb-2" size={32} />
                            <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] animate-pulse">Digitizing Inquiries...</p>
                        </div>
                    )}
                </div>

                {!scanning && scannedQuestions.length === 0 && (
                    <button 
                        onClick={startScan}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Search size={16} />
                        Run AI OCR Extraction
                    </button>
                )}

                {scannedQuestions.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-xs font-black text-white uppercase tracking-tight">Scan Successful</p>
                                <p className="text-[9px] font-bold text-emerald-500 uppercase">{scannedQuestions.length} Questions Extracted</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => onStartTest(scannedQuestions)}
                            className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
                        >
                            <PlayCircle size={18} />
                            Start Digital Mock Test
                        </button>
                    </motion.div>
                )}

                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500">
                        <AlertCircle size={18} />
                        <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="px-2 flex items-center gap-2 opacity-40">
          <FileSearch size={10} className="text-blue-500" />
          <p className="text-[8px] font-black uppercase tracking-widest text-white italic">
            Import your offline test papers and coaching modules into the app instantly.
          </p>
      </div>
    </div>
  );
};
