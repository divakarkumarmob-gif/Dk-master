import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Sparkles, AlertCircle, KeyRound, ChevronRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

type RegStep = 'EMAIL' | 'OTP' | 'PASSWORD';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [regStep, setRegStep] = useState<RegStep>('EMAIL');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetForm = () => {
    setError('');
    setMessage('');
    setRegStep('EMAIL');
    setLoading(false);
  };

  const handleSendOTP = async () => {
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    setError('');
  try {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (data.success) {
      setMessage(data.message);
      if (data.dev && data.code) {
         console.log("DEV MODE OTP:", data.code);
         setOtp(data.code);
      }
      setRegStep('OTP');
    } else {
      setError(data.error || 'Failed to send OTP.');
    }
  } catch (err) {
    setError('Network error. Please try again later.');
  }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp) { setError('OTP is required'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await response.json();
      if (data.success) {
        setRegStep('PASSWORD');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Verification failed.');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Registration successful! onAuthStateChanged in App.tsx will handle the rest
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Invalid Gmail or Password');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) { setError('Please enter your email'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-sm bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl"
      >
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <Sparkles className="text-blue-400" size={32} />
           </div>
           <h2 className="text-2xl font-black tracking-tight text-white">
             {isLogin ? 'Welcome Back' : 'Join NEET Prep'}
           </h2>
           <p className="text-slate-400 text-xs mt-1">
             {isLogin ? 'Log in to continue your journey' : 'Secure your registration with OTP'}
           </p>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin} 
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email" 
                    placeholder="Gmail Address" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full pl-12 p-4 rounded-2xl bg-slate-900/50 border border-slate-700 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                    required 
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full pl-12 pr-12 p-4 rounded-2xl bg-slate-900/50 border border-slate-700 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-600/20"
                >
                  {loading ? 'Validating...' : 'Log In'}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="register"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {regStep === 'EMAIL' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="email" 
                        placeholder="Enter Gmail" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="w-full pl-12 p-4 rounded-2xl bg-slate-900/50 border border-slate-700 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                      />
                    </div>
                    <button 
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full bg-blue-600 p-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                      {loading ? 'Sending OTP...' : 'Send OTP to Gmail'}
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}

                {regStep === 'OTP' && (
                  <div className="space-y-4">
                    <button onClick={() => setRegStep('EMAIL')} className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <ArrowLeft size={12} /> {email}
                    </button>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        placeholder="6-Digit OTP Code" 
                        maxLength={6}
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        className="w-full pl-12 p-4 rounded-2xl bg-slate-900/50 border border-slate-700 focus:border-blue-500 outline-none text-center tracking-[0.5em] font-black text-lg" 
                      />
                    </div>
                    <button 
                      onClick={handleVerifyOTP}
                      disabled={loading}
                      className="w-full bg-green-600 p-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                      {loading ? 'Verifying...' : 'Verify Gmail'}
                      <CheckCircle2 size={18} />
                    </button>
                  </div>
                )}

                {regStep === 'PASSWORD' && (
                  <div className="space-y-4">
                    <h3 className="text-center text-sm font-bold text-green-400">Gmail Verified!</h3>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Create Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full pl-12 pr-12 p-4 rounded-2xl bg-slate-900/50 border border-slate-700 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button 
                      onClick={handleRegister}
                      disabled={loading}
                      className="w-full bg-blue-600 p-4 rounded-2xl font-bold"
                    >
                      {loading ? 'Creating Account...' : 'Complete Registration'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] flex items-start gap-2"
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-xs text-blue-400 py-2"
            >
              {message}
            </motion.div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center space-y-4">
            <button 
              onClick={() => { setIsLogin(!isLogin); resetForm(); }} 
              className="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors"
            >
              {isLogin ? "New user? Create Gmail Profile" : "Already verified? Go to Login"}
            </button>
            
            {isLogin && (
              <button 
                onClick={handleResetPassword} 
                className="block w-full text-[10px] uppercase tracking-widest font-bold text-slate-600 hover:text-slate-400"
              >
                Forgot Credentials?
              </button>
            )}
        </div>
      </motion.div>
    </div>
  );
};
