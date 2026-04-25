import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, User, Save, ChevronLeft, Trash2, Camera, Edit2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { deleteUser } from 'firebase/auth';

export const EditProfile: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const usernameFromStore = useAppStore((state) => state.user?.username || '');
    const [username, setUsername] = useState(usernameFromStore);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { user, showToast, setUser } = useAppStore();

    const handleSave = async () => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), { username });
            setUser({ ...user, username });
            showToast('Username Updated.', 'success');
            setIsEditing(false);
        } catch (e) {
            showToast('Failed to update.', 'error');
        }
    };

    const handleDelete = async () => {
        if (!user || !auth.currentUser) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid));
            await deleteUser(auth.currentUser);
            setUser(null);
            showToast('Account Deleted', 'info');
        } catch (e) {
            showToast('Delete Failed', 'error');
        }
    };

    return (
        <div className="space-y-6">
             <header className="flex items-center gap-4 px-2">
                <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border border-line"><ChevronLeft size={20} /></button>
                <h2 className="text-xl font-display font-black uppercase">Edit Identity</h2>
             </header>

             <div className="bg-white p-6 rounded-[32px] border border-line shadow-sm space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <button className="w-24 h-24 rounded-full bg-slate-50 border-4 border-slate-100 flex items-center justify-center text-slate-300 relative group overflow-hidden">
                        {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <User size={48} />}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                            <Camera size={24}/>
                        </div>
                    </button>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Tap to update Alias Photo</p>
                </div>
                
                <div className="space-y-4">
                    <InputField 
                        label="Username" 
                        value={username} 
                        onChange={setUsername} 
                        readOnly={!isEditing}
                        onEdit={() => setIsEditing(true)}
                    />
                    <InputField label="Identity Link" value={user?.email || ''} readOnly />
                </div>

                {isEditing && (
                    <button onClick={handleSave} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                        <Save size={18} /> Save Changes
                    </button>
                )}
             </div>

             <button onClick={() => setShowDeleteModal(true)} className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-sm">
                Permanently Delete Account
             </button>

             <AnimatePresence>
                {showDeleteModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white p-6 rounded-3xl space-y-4 text-center">
                            <h3 className="font-black text-lg">Are you sure?</h3>
                            <p className="text-sm">This will clear all your data permanently. This action cannot be undone.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-200 rounded-xl font-bold">No</button>
                                <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Yes</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
             </AnimatePresence>
        </div>
    );
};

const InputField = ({ label, value, onChange, onEdit, readOnly }: { label: string, value: string, onChange?: (val: string) => void, onEdit?: () => void, readOnly?: boolean }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-green-800 px-1">{label}</label>
        <div className="relative">
            <input 
                type="text" 
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                readOnly={readOnly}
                className="w-full p-4 bg-green-50 text-green-900 rounded-2xl border-2 border-transparent focus:border-green-400 outline-none font-bold pr-12"
            />
            {onEdit && readOnly && (
                <button onClick={onEdit} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-green-700 hover:bg-green-100 rounded-lg">
                    <Edit2 size={16} />
                </button>
            )}
        </div>
    </div>
);
