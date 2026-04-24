import React, { useState } from 'react';
import { motion } from 'motion/react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAppStore } from '../store/useAppStore';
import { LogIn, UserPlus, Chrome, Sparkles } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const showToast = useAppStore(state => state.showToast);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome back!', 'success');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Account created!', 'success');
      }
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast('Logged in with Google', 'success');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-100/50 via-white to-transparent">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-orange-accent rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-4">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">NEET Prep Master</h1>
          <p className="text-slate-500 font-medium">Your Neural AI Study Companion</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email Protocol</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-accent outline-none transition-all font-bold"
                placeholder="aspirant@neet.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Security Key</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-accent outline-none transition-all font-bold"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
              {loading ? '' : (isLogin ? 'Initialize Session' : 'Create Credentials')}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400">
              <span className="bg-white px-4 italic">Neural Link</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-50"
          >
            <Chrome size={18} />
            Connect via Google
          </button>

          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-accent transition-colors"
          >
            {isLogin ? "Need new credentials? Register here" : "Already registered? Access here"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
