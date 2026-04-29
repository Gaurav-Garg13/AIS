import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { BookOpen, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { apiFetch } from '../utils/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError(null);
      if (!credentialResponse.credential) throw new Error('Google authentication failed');

      const res = await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google login failed');

      login(data);
      showToast('Welcome back to StudyFlow', { type: 'success' });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin ? { email, password } : { email, password, name };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      login(data);
      showToast(isLogin ? 'Logged in successfully' : 'Account created successfully', { type: 'success' });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white dark:bg-[#121110]">
      {/* 40% Creative Left Panel */}
      <div className="hidden lg:flex w-[40%] bg-sage-900 relative flex-col justify-between p-12 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        {/* Abstract Shapes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[30%] -left-[30%] w-[100%] h-[100%] rounded-full border-[1px] border-white/5 border-dashed"
        ></motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] rounded-full border-[1px] border-white/10"
        ></motion.div>

        {/* Soft Glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-sage-600/30 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen size={24} className="text-sage-900" />
          </div>
          <span className="text-2xl font-serif italic font-bold text-white tracking-tight">StudyFlow</span>
        </div>

        {/* Messaging */}
        <div className="relative z-10 mb-10">
          <h1 className="text-5xl xl:text-6xl font-serif text-white leading-[1.1] mb-6">
            Master your <br />
            <span className="italic text-sage-200">academic</span> destiny.
          </h1>
          <p className="text-sage-200/80 text-lg leading-relaxed max-w-md">
            Where predictive intelligence meets focused design. Build better habits, track your progress, and achieve excellence.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-sage-900 bg-sage-800 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                S{i}
              </div>
            ))}
          </div>
          <span className="text-sage-300 text-sm font-medium tracking-wide uppercase">Trusted by Scholars</span>
        </div>
      </div>

      {/* 60% Functional Right Panel */}
      <div className="flex-1 w-full lg:w-[60%] bg-[#F5F2EA] relative flex items-center justify-center p-6 sm:p-12 overflow-hidden">

        {/* --- Dynamic Background Elements for Right Panel --- */}
        {/* 1. Subtle Diagonal Hatching Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 16px)' }}>
        </div>

        {/* 2. Ambient Glowing Orbs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-sage-300/20 rounded-full blur-[100px] pointer-events-none"
        ></motion.div>

        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[5%] right-[5%] w-[500px] h-[500px] bg-slate-300/30 rounded-full blur-[120px] pointer-events-none"
        ></motion.div>
        {/* --------------------------------------------------- */}

        {/* Centered Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[480px] bg-[#FCFAF8] rounded-[32px] p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-[#EBE6DD] relative z-10"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-sage-900 rounded-xl flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-xl font-serif italic font-bold text-sage-900 tracking-tight">StudyFlow</span>
          </div>

          <div className="mb-10 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-sans font-black text-slate-900 mb-2 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Enter your details to continue.' : 'Begin your journey today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-5 py-4 bg-[#F0ECE1] border-2 border-transparent focus:bg-[#FCFAF8] focus:border-sage-400 rounded-2xl text-slate-900 placeholder-slate-400 transition-all font-semibold text-base"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-5 py-4 bg-[#F0ECE1] border-2 border-transparent focus:bg-[#FCFAF8] focus:border-sage-400 rounded-2xl text-slate-900 placeholder-slate-400 transition-all font-semibold text-base"
                placeholder="you@university.edu"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                {isLogin && (
                  <Link to="/forgot" className="text-xs font-bold text-sage-600 hover:text-sage-800 transition-colors">
                    Forgot?
                  </Link>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-5 py-4 bg-[#F0ECE1] border-2 border-transparent focus:bg-[#FCFAF8] focus:border-sage-400 rounded-2xl text-slate-900 placeholder-slate-400 transition-all font-semibold text-base"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 rounded-xl flex items-center gap-3">
                <ShieldCheck size={20} className="text-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 bg-sage-900 hover:bg-sage-800 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-sage-900/20"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#EBE6DD]"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
            <div className="flex-1 h-px bg-[#EBE6DD]"></div>
          </div>

          <div className="w-full flex justify-center pt-2">
            <div className="w-full [&>div]:w-full flex justify-center transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-md drop-shadow-sm">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError('Google login failed');
                  showToast('Google login failed', { type: 'error' });
                }}
                useOneTap
                theme="outline"
                shape="pill"
                size="large"
                text="continue_with"
              />
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm font-medium text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-sage-700 font-bold hover:underline underline-offset-4"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
