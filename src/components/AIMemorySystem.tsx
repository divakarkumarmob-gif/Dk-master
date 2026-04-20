import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Share2, Brain } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const AIMemorySystem: React.FC = () => {
    const { chatHistory } = useAppStore();
    const [unlocked, setUnlocked] = useState(false);
    const [pin, setPin] = useState('');

    const handleExport = () => {
        const data = { chatHistory, backupTime: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'memory_backup.json';
        a.click();
    };

    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-indigo-950 to-slate-900 min-h-screen text-white rounded-3xl">
            <h2 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI Memory Centre</h2>
            
            {!unlocked ? (
                <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <input type="password" placeholder="Enter Security Code" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-gray-500" />
                    <button onClick={() => pin === '556065' && setUnlocked(true)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-white p-4 rounded-xl hover:opacity-90 transition-opacity">Unlock Access</button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                        <p className="text-blue-300 font-black uppercase text-[10px] tracking-widest">Total Interaction Records</p>
                        <p className="text-3xl font-black text-white">{chatHistory.length}</p>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="font-black text-xs uppercase tracking-widest text-purple-300">Interaction History</h3>
                        {chatHistory.length === 0 ? <p className="text-sm opacity-50 italic">No history found</p> : (
                            chatHistory.map((m) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={m.id} 
                                    className={`p-4 rounded-2xl text-sm border ${m.role === 'user' ? 'bg-blue-600/20 border-blue-500/30' : 'bg-slate-800 border-slate-700'}`}
                                >
                                    <p className="font-black text-[9px] uppercase tracking-widest mb-1 opacity-60 flex items-center gap-2">
                                        <Brain size={12} /> {m.role}
                                    </p>
                                    <p className="text-white/90 font-medium">{m.text}</p>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button onClick={handleExport} className="flex-1 bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest transition-all"><Download size={18} /> Export</button>
                        <button onClick={() => window.open('https://t.me/Studymasternote_bot', '_blank')} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-widest transition-all"><Share2 size={18} /> Share</button>
                    </div>
                </div>
            )}
        </div>
    );
};
