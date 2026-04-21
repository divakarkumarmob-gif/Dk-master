import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Camera, 
  Mic, 
  MapPin, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const CompatibilityHub: React.FC = () => {
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    geolocation: false,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const checks = {
      camera: false,
      microphone: false,
      geolocation: false
    };

    try {
      const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
      checks.camera = cam.state === 'granted';
      
      const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      checks.microphone = mic.state === 'granted';
      
      const geo = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      checks.geolocation = geo.state === 'granted';
    } catch (e) {
      console.warn("Permission API not fully supported", e);
    }
    setPermissions(checks);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center border border-purple-500/30">
            <Settings size={18} />
        </div>
        <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">System Health & Compatibility</h3>
            <p className="text-[9px] font-bold text-purple-500 uppercase tracking-tighter opacity-60">Troubleshoot Browser Limits</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-purple-500/20 rounded-[32px] p-6 space-y-4">
        <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Environment Status</p>
            <button onClick={checkPermissions} className="text-purple-400 hover:text-purple-300">
                <RefreshCw size={14} />
            </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
            {[
                { name: 'Camera', icon: Camera, status: permissions.camera },
                { name: 'Microphone', icon: Mic, status: permissions.microphone },
                { name: 'Geolocation', icon: MapPin, status: permissions.geolocation },
            ].map((p) => (
                <div key={p.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <p.icon size={16} className={p.status ? "text-emerald-500" : "text-zinc-600"} />
                        <span className="text-[11px] font-bold text-white uppercase tracking-tight">{p.name}</span>
                    </div>
                    {p.status ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-zinc-600" />}
                </div>
            ))}
        </div>

        <button 
           className="w-full py-4 bg-purple-600 rounded-2xl flex items-center justify-center gap-2 group hover:bg-purple-500 transition-all text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-purple-500/20"
           onClick={() => window.open(window.location.href, '_blank')}
        >
            <ExternalLink size={14} />
            Open in New Tab (Stable)
        </button>
      </div>
    </div>
  );
};
