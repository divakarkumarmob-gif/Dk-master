import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Settings2, Database, Shield } from 'lucide-react';

export const CompatibilityHub: React.FC = () => {
    return (
        <div className="space-y-3">
             <StatusLine label="Neural Sync" status="Operational" active />
             <StatusLine label="Local Buffer" status="12.4 MB" />
             <StatusLine label="AI Core" status="v3.1 Stable" active />
        </div>
    );
};

const StatusLine = ({ label, status, active }: { label: string, status: string, active?: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
            {active && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight">{status}</span>
        </div>
    </div>
);
