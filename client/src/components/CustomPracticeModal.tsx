import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, Code, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { convertToMCQs } from '../services/aiConverter';
import { Question } from '../store/useAppStore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

interface CustomPracticeModalProps {
    onClose: () => void;
    onStartTest: (config: { 
        id: string; 
        type: 'Minor' | 'Major' | 'Custom'; 
        subject?: string; 
        chapter?: string;
        questions?: Question[];
    }) => void;
}

export const CustomPracticeModal: React.FC<CustomPracticeModalProps> = ({ onClose, onStartTest }) => {
    const [file, setFile] = useState<File | null>(null);
    const [format, setFormat] = useState<'pdf' | 'json'>('pdf');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setProgress(0);
        setError(null);
        try {
            // Upload to storage
            const storageRef = ref(storage, `custom-practice/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(p);
                }, 
                (error) => {
                  console.error(error);
                  setError(error.message);
                  setUploading(false);
                },
                async () => {
                    // ... ... ... rest of code
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    // Generate MCQs
                    const content = await file.text();
                    const mcqs = await convertToMCQs(content);
                    const questions: Question[] = mcqs.map(q => ({
                        id: Math.random().toString(),
                        text: q.question,
                        options: [q.options.A, q.options.B, q.options.C, q.options.D],
                        correctAnswer: q.correct_answer === 'A' ? 0 : q.correct_answer === 'B' ? 1 : q.correct_answer === 'C' ? 2 : 3,
                        explanation: q.explanation
                    }));
                    
                    onStartTest({
                        id: `custom-${Date.now()}`,
                        type: 'Custom',
                        subject: 'Custom',
                        chapter: file.name,
                        questions
                    });
                    setUploading(false);
                    onClose();
                }
            );
        } catch (e) {
            console.error(e);
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-slate-900 p-8 rounded-[40px] border border-white/10 relative"
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white">
                    <X size={24} />
                </button>
                
                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6">Custom Practice</h2>
                
                <div className="flex gap-4 mb-6">
                    <button onClick={() => setFormat('pdf')} className={cn("flex-1 p-4 rounded-2xl flex items-center justify-center gap-2", format === 'pdf' ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white/50")}>
                        <FileText size={18} /> PDF
                    </button>
                    <button onClick={() => setFormat('json')} className={cn("flex-1 p-4 rounded-2xl flex items-center justify-center gap-2", format === 'json' ? "bg-amber-500/20 text-amber-500" : "bg-white/5 text-white/50")}>
                        <Code size={18} /> JSON
                    </button>
                </div>

                <label htmlFor="file-upload" className="block w-full">
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 mb-6 cursor-pointer hover:border-white/20 transition-colors">
                        <Upload size={32} className="text-white/30" />
                        <span className="text-sm font-bold text-white/70">
                            {file ? file.name : `Click to upload ${format.toUpperCase()}`}
                        </span>
                        
                        <input 
                            type="file" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)} 
                            className="hidden" 
                            id="file-upload" 
                            accept={format === 'pdf' ? '.pdf' : '.json'}
                        />
                    </div>
                </label>

                <button 
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className={cn(
                        "w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all",
                        file && !uploading ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                >
                    {uploading ? (
                        <div className="flex flex-col gap-2">
                             <span>{Math.round(progress)}% Uploading...</span>
                             <div className="h-1 bg-black/20 w-full rounded-full overflow-hidden">
                                 <motion.div className="h-full bg-white" animate={{ width: `${progress}%` }} />
                             </div>
                        </div>
                    ) : "Start Test"}
                </button>
                {error && <p className="text-red-500 text-xs mt-4 text-center">{error}</p>}
            </motion.div>
        </div>
    );
};
