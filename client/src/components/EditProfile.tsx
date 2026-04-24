import React from 'react';
import { motion } from 'motion/react';
import { Brain, User, Save, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const EditProfile: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { user } = useAppStore();
    return (
        <div className="space-y-6">
             <header className="flex items-center gap-4 px-2">
                <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border border-line"><ChevronLeft size={20} /></button>
                <h2 className="text-xl font-display font-black uppercase">Edit Identity</h2>
             </header>

             <div className="bg-white p-6 rounded-[32px] border border-line shadow-sm space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-slate-100 flex items-center justify-center text-slate-300">
                        <User size={48} />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <InputField label="Neural Alias" value={user?.email?.split('@')[0] || ''} />
                    <InputField label="Identity Link" value={user?.email || ''} readOnly />
                </div>

                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Save Terminal Config</button>
             </div>
        </div>
    );
};

const InputField = ({ label, value, readOnly }: { label: string, value: string, readOnly?: boolean }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label}</label>
        <input 
            type="text" 
            value={value}
            readOnly={readOnly}
            className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-accent outline-none font-bold"
        />
    </div>
);
