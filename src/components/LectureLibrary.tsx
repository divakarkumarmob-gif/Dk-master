import React, { useState } from 'react';
import { Search, Play, BookOpen, ChevronRight } from 'lucide-react';
import { ALL_CHAPTERS } from '../data/chapters';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const LectureLibrary = () => {
    const [search, setSearch] = useState('');
    const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry' | 'Biology'>('Physics');

    const subjects = ['Physics', 'Chemistry', 'Biology'] as const;
    const chapters = ALL_CHAPTERS[activeSubject] || [];

    const filteredChapters = chapters.filter(c => c.toLowerCase().includes(search.toLowerCase()));

    return (
    <div className="space-y-2 p-0">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-emerald-500" size={16} />
                <input 
                    type="text"
                    placeholder="Search chapter..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
            </div>

            {/* Subject Tabs */}
            <div className="flex bg-zinc-900 rounded-lg p-0.5 gap-0.5">
                {subjects.map(sub => (
                    <button 
                        key={sub}
                        onClick={() => setActiveSubject(sub)}
                        className={cn(
                            "flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors",
                            activeSubject === sub ? "bg-emerald-600 text-white" : "text-zinc-500"
                        )}
                    >
                        {sub}
                    </button>
                ))}
            </div>

            {/* Chapter List */}
            <div className="space-y-1 max-h-[142px] overflow-y-auto pr-1">
                {filteredChapters.map((chapter, idx) => {
                    const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(chapter + " class 11 12 " + activeSubject + " full lecture")}`;
                    return (
                        <motion.a
                            key={idx}
                            href={videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center justify-between bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800 hover:border-emerald-500/50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <BookOpen size={14} className="text-emerald-500 shrink-0" />
                                <span className="text-[11px] font-medium text-zinc-300 line-clamp-1">{chapter}</span>
                            </div>
                            <Play size={12} className="text-emerald-500" />
                        </motion.a>
                    );
                })}
                {filteredChapters.length === 0 && <p className="text-center text-[10px] text-zinc-600 py-3">No chapters found</p>}
            </div>
        </div>
    );
};
