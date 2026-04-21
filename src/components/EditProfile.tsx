import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, X, Camera, Trash2, Save } from 'lucide-react';
import { deleteUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppStore } from '../store/useAppStore';

interface EditProfileProps {
  onBack: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ onBack }) => {
  const { user, updateProfileDisplayName } = useAppStore();
  const [username, setUsername] = useState(user?.email?.split('@')[0] || '');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (window.confirm("Kya aap sach mein apna account permanent delete karna chahte hain? Isse aapka sara data chala jayega.")) {
      try {
        if (auth.currentUser) {
          await deleteUser(auth.currentUser);
          // Redirect or handle logout after successful deletion
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Account deletion failed:", error);
        alert("Account delete karne mein dikat aayi. Shayad aapko phir se login karna pade.");
      }
    }
  };

  const handleSave = () => {
    updateProfileDisplayName(username);
    alert(`Admin alert: User ${user?.email} has updated their username to ${username}.`);
    onBack();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase tracking-tight">Edit Profile</h2>
        <button onClick={onBack} className="p-2 bg-zinc-100 rounded-full"><X size={20} /></button>
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
            className="w-full p-4 rounded-2xl bg-emerald-600 text-white font-medium border border-emerald-500 placeholder:text-emerald-100" 
        />
      </div>

      <button onClick={handleSave} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
        <Save size={18} /> Save Changes
      </button>

      <button onClick={handleDeleteAccount} className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 border border-red-200">
        <Trash2 size={18} /> Permanent Account Delete
      </button>
    </motion.div>
  );
};
