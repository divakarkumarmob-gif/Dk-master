import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithCustomToken
} from 'firebase/auth';
import { useAppStore } from '../store/useAppStore';
import { LogIn, UserPlus, Chrome, Sparkles, Mail, Lock, ArrowRight, Loader2, KeyRound, ShieldAlert, Eye, EyeOff } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [showUserNotFound, setShowUserNotFound] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const showToast = useAppStore(state => state.showToast);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Neural Link Established.', 'success');
      } else if (authMode === 'signup' || authMode === 'forgot' || authMode === 'otp') {
        if (!otpSent) {
          // STEP 1: Send OTP
          if (timer > 0) {
             throw new Error(`Please wait ${Math.ceil(timer / 60)} minutes before resending.`);
          }
          const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (data.success) {
            setOtpSent(true);
            showToast('OTP transmitted to Gmail.', 'success');
            
            const nextAttempts = otpAttempts + 1;
            setOtpAttempts(nextAttempts);
            // 2 min -> 120s, 5 min -> 300s, 10 min -> 600s
            const delay = nextAttempts === 1 ? 120 : (nextAttempts === 2 ? 300 : 600);
            setTimer(delay);
          } else {
            throw new Error(data.error || 'Failed to send OTP');
          }
        } else if (!isVerified) {
          // STEP 2: Verify OTP
          const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: otp })
          });
          const data = await res.json();
          if (data.success && data.sessionToken) {
            setIsVerified(true);
            setSessionToken(data.sessionToken);
            showToast('Email verified. Define security key.', 'success');
          } else {
            throw new Error(data.error || 'Invalid OTP');
          }
        } else if (authMode !== 'otp') {
          // STEP 3: Set Password
          const res = await fetch('/api/auth/set-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, sessionToken })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Security Key Created. Please Login.', 'success');
            // Back to login after success
            setAuthMode('login');
            setOtpSent(false);
            setIsVerified(false);
            setPassword('');
            setOtp('');
            setOtpAttempts(0);
            setTimer(0);
          } else {
            throw new Error(data.error || 'Failed to set password');
          }
        }
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') {
        setShowUserNotFound(true);
        setTimeout(() => setShowUserNotFound(false), 2000);
        msg = "No account found. Create one.";
      }
      if (err.code === 'auth/email-already-in-use') msg = "Gmail already registered.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect security key.";
      setError(msg);
      showToast(msg, 'error');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast('Neural Link Sync via Google.', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <AnimatePresence>
        {showUserNotFound && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="bg-orange-600 p-8 rounded-[40px] shadow-2xl border border-white/20 text-center space-y-4 max-w-xs ring-8 ring-orange-600/10">
              <ShieldAlert size={48} className="mx-auto text-white" />
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Access Denied</h3>
                <p className="text-xs text-white/80 font-bold uppercase tracking-widest leading-relaxed">No account found.<br/>Please Register First.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10 space-y-3">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-[0_0_40px_rgba(249,115,22,0.3)] mb-6 ring-4 ring-white/5"
          >
            <Sparkles size={40} className="drop-shadow-lg" />
          </motion.div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">NEET PREP</h1>
          <p className="text-white/40 font-bold text-xs uppercase tracking-[0.3em]">Neural Study Environment</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[40px] border border-white/10 shadow-2xl space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={authMode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <h2 className="text-2xl font-black text-white uppercase mb-2">
                {authMode === 'forgot' ? 'Recover Link' : 
                 authMode === 'login' ? 'System Access' : 
                 authMode === 'signup' ? 'New Student' : 'OTP Verification'}
              </h2>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                {authMode === 'forgot' ? 'Send a secure reset code to your Gmail.' : 
                 authMode === 'login' ? 'Establish secure connection to neural headquarters.' : 
                 authMode === 'signup' ? 'Initialize new student credentials in the database.' : 
                 'Access via one-time secure code transmitted to Gmail.'}
              </p>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  disabled={otpSent && authMode !== 'login'}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-5 pl-14 bg-white/5 rounded-3xl border border-white/5 focus:border-orange-500 outline-none transition-all font-bold text-white text-sm placeholder:text-white/20 disabled:opacity-50"
                  placeholder="GMAIL"
                  required
                />
              </div>
            </div>

            {((authMode === 'signup' || authMode === 'forgot' || authMode === 'otp') && otpSent && !isVerified) && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-5 pl-14 bg-white/5 rounded-3xl border border-white/5 focus:border-orange-500 outline-none transition-all font-bold text-white text-sm placeholder:text-white/20"
                    placeholder="6-DIGIT CODE"
                    required
                  />
                </div>
              </motion.div>
            )}

            {(authMode === 'login' || ((authMode === 'signup' || authMode === 'forgot') && isVerified)) && (
              <div className="space-y-2">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-5 pl-14 pr-14 bg-white/5 rounded-3xl border border-white/5 focus:border-orange-500 outline-none transition-all font-bold text-white text-sm placeholder:text-white/20"
                    placeholder="SECURITY KEY"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-orange-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-[10px] font-black uppercase text-center tracking-widest bg-red-500/10 p-3 rounded-2xl border border-red-500/20"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-[0_10px_30px_rgba(249,115,22,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {(authMode === 'signup' || authMode === 'forgot' || authMode === 'otp') ? (otpSent ? (isVerified ? 'ENTER' : 'Verify Code') : (timer > 0 ? `Resend ${Math.ceil(timer / 60)}m` : 'Transmit Code')) : 
                   authMode === 'login' ? 'ENTER' : 'ENTER'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {authMode !== 'otp' && (
            <>
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center px-4">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.4em] text-white/20">
                  <span className="bg-slate-900/50 backdrop-blur-md px-6">Neural Bridge</span>
                </div>
              </div>

              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-white/10 disabled:opacity-50"
              >
                <Chrome size={20} className="text-orange-500" />
                Auth via Google
              </button>
            </>
          )}

          <div className="flex flex-col items-center gap-4 pt-4">
            <button 
              onClick={() => {
                if (authMode === 'otp') setAuthMode('login');
                else if (authMode === 'forgot') setAuthMode('login');
                else setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setError('');
                setPassword('');
                setOtp('');
                setOtpSent(false);
                setIsVerified(false);
                setSessionToken('');
              }}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-orange-500 transition-colors"
            >
              {authMode === 'forgot' ? "Return to Access Panel" : 
               authMode === 'otp' ? "Back to Password login" :
               authMode === 'login' ? "Create Student Account" : "Already Registered? Sync Here"}
            </button>

            {authMode === 'login' && (
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setAuthMode('forgot')}
                  className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors"
                >
                  Forgot Security Key?
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Footer */}
        <div className="mt-8 text-center space-y-1 opacity-20">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Encrypted Neural Connection</p>
          <div className="flex justify-center gap-4 text-[8px] font-bold text-white uppercase">
            <span>Server: v4.2.0-Production</span>
            <span>Uptime: 99.99%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

