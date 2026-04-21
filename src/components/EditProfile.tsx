import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, X, Camera, Trash2, Save, AlertTriangle } from 'lucide-react';
import { deleteUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppStore } from '../store/useAppStore';

interface EditProfileProps {
  onBack: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ onBack }) => {
  const { user, updateProfileDisplayName, logout } = useAppStore();
  const [username, setUsername] = useState(user?.email?.split('@')[0] || '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const performDeletion = async () => {
    setIsProcessing(true);
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        logout(); // System logout
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Account deletion failed:", error);
      alert("Account delete karne mein dikat aayi. Shayad aapko security ke liye phir se logout karke login karna pade, tabhi delete hoga.");
      setShowConfirmDelete(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    updateProfileDisplayName(username);
    alert(`Admin alert: User ${user?.email} has updated their username to ${username}.`);
    onBack();
  };

  return (
    <div className="relative h-full">
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight">Edit Profile</h2>
          <button onClick={onBack} disabled={showConfirmDelete} className="p-2 bg-zinc-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-olive-primary/10 flex items-center justify-center text-olive-primary relative">
              <User size={40} />
              <button className="absolute bottom-0 right-0 p-2 bg-orange-accent text-white rounded-full"><Camera size={16} /></button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-widest text-text-muted">Username</label>
          <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 rounded-2xl bg-emerald-600 text-white font-medium border border-emerald-500 placeholder:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400" 
          />
        </div>

        <button onClick={handleSave} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform">
          <Save size={18} /> Save Changes
        </button>

        <button onClick={() => setShowConfirmDelete(true)} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 border border-red-200 active:scale-[0.98] transition-transform">
          <Trash2 size={18} /> Permanent Account Delete
        </button>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmDelete(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase">Are you sure?</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Kya aap sach mein apna account delete karna chahte hain? Isse aapka sara data (notes, results) permanent delete ho jayega.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirmDelete(false)} 
                  disabled={isProcessing}
                  className="py-4 bg-zinc-100 text-slate-600 font-bold rounded-2xl active:scale-[0.95] transition-transform disabled:opacity-50"
                >
                  No, Cancel
                </button>
                <button 
                  onClick={performDeletion}
                  disabled={isProcessing}
                  className="py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/30 active:scale-[0.95] transition-transform disabled:opacity-50 flex items-center justify-center"
                >
                  {isProcessing ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
