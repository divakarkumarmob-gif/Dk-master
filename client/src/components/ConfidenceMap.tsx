import React from 'react';
import { motion } from 'motion/react';
import { Target, Map, MapPin, Sparkles } from 'lucide-react';

export const ConfidenceMap: React.FC = () => {
    return (
        <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                        <Map size={24} className="text-orange-accent" />
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight">Confidence Map</h3>
                    <p className="text-[10px] opacity-60 uppercase font-black tracking-widest">Syllabus node status</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <SubjectStat label="Biology" value="82%" color="bg-green-500" />
                     <SubjectStat label="Physics" value="45%" color="bg-red-500" />
                </div>
            </div>
        </div>
    );
};

const SubjectStat = ({ label, value, color }: { label: string, value: string, color: string }) => (
    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-1">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</span>
        <div className="flex items-center justify-between">
            <span className="text-sm font-black">{value}</span>
            <div className={cn("w-1.5 h-1.5 rounded-full", color)} />
        </div>
    </div>
);

import { cn } from '../lib/utils';
