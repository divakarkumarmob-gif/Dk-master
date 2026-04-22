import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Youtube, 
  Play, 
  ExternalLink, 
  BookOpen, 
  Search,
  MonitorPlay,
  X,
  Sparkles,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { getDailyChapters } from '../store/useAppStore';
import { cn } from '../lib/utils';
import { geminiService } from '../services/gemini';
import { VideoModal } from './VideoModal';

interface VideoSource {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  subject: string;
  url: string;
}

export const VideoVault: React.FC = () => {
  const daily = getDailyChapters();
  const [activeVideo, setActiveVideo] = useState<{ id: string, title: string } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Curated logic: In a real app, this would be a YouTube API search based on daily chapters.
  // For now, we generate contextual search links for the daily chapters.
  const subjects = Object.keys(daily.chapters);
  
  const suggestedVideos: VideoSource[] = subjects.map(subject => ({
    id: subject,
    title: `${daily.chapters[subject as keyof typeof daily.chapters]} - High Yield Revision`,
    channel: "Top NEET Educators",
    thumbnail: `https://picsum.photos/seed/${subject}/400/225`,
    subject: subject,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(daily.chapters[subject as keyof typeof daily.chapters] + " revision neet " + subject)}`
  }));

  const handlePlayVideo = async (video: VideoSource) => {
    setLoadingId(video.id);
    const videoId = await geminiService.getYoutubeVideoId(video.title);
    if (videoId) {
        setActiveVideo({ id: videoId, title: video.title });
    } else {
        window.open(video.url, '_blank');
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      {/* ... header ... */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center border border-red-500/30">
            <Youtube size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">NCERT Video Vault</h3>
            <p className="text-[9px] font-bold text-red-500 uppercase tracking-tighter opacity-60">AI Curated Lectures</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            <MonitorPlay size={10} className="text-red-400" />
            <span className="text-[10px] font-black text-red-400 tracking-tighter uppercase">HD Revision</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-amber-400" />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Suggested for Today's Targets</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {suggestedVideos.map((video) => (
                <div 
                    key={video.id}
                    className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-red-500/30 transition-all cursor-pointer"
                    onClick={() => handlePlayVideo(video)}
                >
                    <div className="aspect-video relative overflow-hidden">
                        <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className={cn(
                                "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60",
                                loadingId === video.id && "animate-pulse"
                            )}
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/40">
                                {loadingId === video.id ? (
                                    <Loader2 size={24} className="text-white animate-spin" />
                                ) : (
                                    <Play size={24} className="text-white ml-1 fill-current" />
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                            <span className="text-[8px] font-black px-2 py-0.5 bg-red-600 text-white rounded-md uppercase tracking-wider">
                                {video.subject}
                            </span>
                        </div>
                    </div>
                    <div className="p-4 flex justify-between items-start gap-4">
                        <div className="space-y-1">
                            <h4 className="text-xs font-black text-white leading-snug group-hover:text-red-400 transition-colors">
                                {video.title}
                            </h4>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight flex items-center gap-1">
                                <BookOpen size={10} />
                                {video.channel}
                            </p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl text-zinc-400 group-hover:text-white transition-colors">
                            <Play size={14} />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <button 
           className="w-full py-4 border border-white/10 rounded-2xl flex items-center justify-center gap-3 group hover:bg-white/5 transition-all text-xs font-black uppercase tracking-[0.2em] text-white"
           onClick={() => window.open('https://www.youtube.com/results?search_query=neet+one+shot+revision+physics+chemistry+biology', '_blank')}
        >
            <Search size={14} className="text-zinc-500 group-hover:text-red-500" />
            Global Search Library
        </button>
      </div>

      <VideoModal 
        videoId={activeVideo?.id || null} 
        title={activeVideo?.title} 
        onClose={() => setActiveVideo(null)} 
      />

      {/* ... footer ... */}
      <div className="px-2 flex items-center gap-2 opacity-40">
          <Youtube size={10} className="text-red-500" />
          <p className="text-[8px] font-black uppercase tracking-widest text-white italic">
            Lectures curated by AI from Top NEET Channels (Physics Wallah, Unacademy, etc.)
          </p>
      </div>
    </div>
  );
};
