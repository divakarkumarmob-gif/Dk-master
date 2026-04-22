import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { BookOpen, Search, FileText, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

export default function StudyMaterialsScreen() {
  const { setActiveTab } = useAppStore();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Biology'>('Physics');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const q = query(collection(db, 'study_materials'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.subject === subject && 
    (m.title.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase()))
  );

  const ncertMaterials = filteredMaterials.filter(m => m.type === 'NCERT');
  const moduleMaterials = filteredMaterials.filter(m => m.type === 'Module');

  const MaterialCard = ({ material }: { material: any }) => (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-white/5 p-4 rounded-xl flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
          <FileText size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{material.title}</h4>
          <span className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
            {(material.size / (1024 * 1024)).toFixed(2)} MB PDF
          </span>
        </div>
      </div>
      <a 
        href={material.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-10 h-10 bg-slate-900 dark:bg-white flex mb-0 items-center justify-center rounded-full text-white dark:text-slate-900 hover:scale-105 active:scale-95 transition-transform shadow-md"
      >
        <Download size={18} />
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-white/5 pt-12 pb-6 px-6 sticky top-0 z-10">
        <button 
            onClick={() => setActiveTab('settings')}
            className="w-10 h-10 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-600 dark:text-white/60 mb-6 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
        >
            <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">NCERT & Modules</h1>
            <p className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mt-0.5">Study Material Vault</p>
          </div>
        </div>

        {/* Subjects */}
        <div className="flex gap-2 bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-2xl w-full">
            {['Physics', 'Chemistry', 'Biology'].map((subj) => (
            <button
                key={subj}
                onClick={() => setSubject(subj as any)}
                className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                subject === subj 
                    ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm" 
                    : "text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60"
                )}
            >
                {subj}
            </button>
            ))}
        </div>
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-white/40" size={18} />
            <input 
                type="text"
                placeholder={`Search ${subject} chapters & notes...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 py-3.5 pl-12 pr-4 rounded-2xl font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-sm"
            />
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-white/40">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="text-xs font-bold uppercase tracking-widest">Loading Library...</p>
            </div>
        ) : (
            <div className="space-y-8">
                {/* NCERT Section */}
                <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/40 mb-4 px-1 flex items-center justify-between">
                        NCERT Chapters
                        <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{ncertMaterials.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ncertMaterials.length > 0 ? (
                            ncertMaterials.map(m => <MaterialCard key={m.id} material={m} />)
                        ) : (
                            <div className="col-span-full p-6 text-center text-slate-400 dark:text-white/30 font-bold border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                                No NCERT PDFs found for {subject}
                            </div>
                        )}
                    </div>
                </section>

                {/* Modules Section */}
                <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/40 mb-4 px-1 flex items-center justify-between">
                        Modules & Notes
                        <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{moduleMaterials.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {moduleMaterials.length > 0 ? (
                            moduleMaterials.map(m => <MaterialCard key={m.id} material={m} />)
                        ) : (
                            <div className="col-span-full p-6 text-center text-slate-400 dark:text-white/30 font-bold border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                                No Module PDFs found for {subject}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        )}
      </div>
    </div>
  );
}
