import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Youtube, Loader2, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface VideoModalProps {
  videoId: string | null;
  onClose: () => void;
  title?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({ videoId, onClose, title }) => {
  const [iframeLoading, setIframeLoading] = useState(true);

  return (
    <AnimatePresence>
      {(videoId || title) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl aspect-video bg-zinc-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Youtube size={18} className="text-white" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest line-clamp-1 truncate max-w-[200px] sm:max-w-md">
                  {title || "In-App Lecture"}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Iframe or Fallback */}
            {videoId ? (
              <div className="relative w-full h-full pt-12 bg-black">
                {iframeLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
                    <Loader2 size={32} className="text-red-600 animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Securing Stream...</p>
                  </div>
                )}
                <iframe
                  className={cn("relative z-10 w-full h-full transition-opacity duration-700", iframeLoading ? "opacity-0" : "opacity-100")}
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
                  title={title || "YouTube Video"}
                  onLoad={() => setIframeLoading(false)}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                
                {/* Always show escape hatch for restricted videos */}
                {!iframeLoading && (
                  <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                      <a 
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg text-[9px] font-black text-white border border-white/20 flex items-center gap-2 transition-all active:scale-95 shadow-xl pointer-events-auto"
                      >
                        <Youtube size={12} className="text-red-500" />
                        Broken? Open in YT
                      </a>

                      <a 
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title || '')}+full+lecture+neet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg text-[9px] font-black text-white border border-white/20 flex items-center gap-2 transition-all active:scale-95 shadow-xl pointer-events-auto"
                      >
                        <Search size={12} className="text-emerald-500" />
                        Try Another Source
                      </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center text-red-600">
                  <Youtube size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Automatic Link Failed</h4>
                  <p className="text-[10px] text-zinc-500 font-bold max-w-[200px]">AI couldn't fetch a direct ID. Search results will open in a safe tab.</p>
                </div>
                <a 
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + " NEET revision lecture")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 px-6 py-3 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Find on YouTube
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
