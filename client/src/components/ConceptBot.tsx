import React from 'react';
import { motion } from 'motion/react';
import { Brain, MessageSquare, Sparkles } from 'lucide-react';

export const ConceptBot: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 leading-none">Concept Bot</h3>
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-500">v1.2 Online</span>
                </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-[12px] text-slate-600 font-medium leading-relaxed italic">"How can I help you visualize complex biology concepts today? Type a topic to decompose into neural nodes."</p>
            </div>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Enter concept (e.g. Krebs Cycle)"
                    className="w-full p-4 pr-12 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-400 font-bold text-sm transition-all shadow-sm"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg transform active:scale-90">
                    <Brain size={16} />
                </button>
            </div>
        </div>
    );
};
