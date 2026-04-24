import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play } from 'lucide-react';

interface VideoModalProps {
    videoId: string;
    onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ videoId, onClose }) => {
    if (!videoId) return null;
    
    return (
        <div 
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4"
            onClick={onClose}
        >
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-8 right-8 w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-xl z-[210] active:scale-90 transition-transform shadow-2xl border border-white/20"
             >
                <X size={24} />
             </button>

             <div 
                className="w-full max-w-4xl aspect-video bg-slate-900 rounded-3xl overflow-hidden animate-in zoom-in duration-300 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
             >
                <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title="Neural Lecture Hub"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
             </div>
             
             <div className="mt-8 text-center text-white/40 font-black uppercase text-[10px] tracking-[0.2em]">
                Neural Video Stream Active
             </div>
        </div>
    );
};
