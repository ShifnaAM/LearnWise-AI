import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { GraduationCap, Mail, Lock, User, AlertCircle, ArrowRight, KeyRound, CheckCircle } from 'lucide-react';

const AuthPage = ({ initialView = 'login' }) => {
  const navigate = useNavigate();
  const { login, register, forgotPassword, resetPassword, authError } = useApp();
  
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [demoCode, setDemoCode] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    token: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Sync route path changes with local state
  useEffect(() => {
    setView(initialView);
    setSuccessMessage('');
    setLocalError('');
    setDemoCode('');
  }, [initialView]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    
    let success = false;
    
    if (view === 'login') {
      success = await login(formData.email, formData.password);
      setLoading(false);
      if (success) {
        navigate('/dashboard');
      }
    } else if (view === 'register') {
      success = await register(formData.name, formData.email, formData.password);
      setLoading(false);
      if (success) {
        navigate('/dashboard');
      }
    } else if (view === 'forgot') {
      const res = await forgotPassword(formData.email);
      setLoading(false);
      if (res.success) {
        setDemoCode(res.code || '');
        setSuccessMessage('Reset code generated successfully. Please use the verification code shown below.');
        setView('reset');
      }
    } else if (view === 'reset') {
      if (formData.newPassword !== formData.confirmPassword) {
        setLocalError('Passwords do not match.');
        setLoading(false);
        return;
      }
      
      const res = await resetPassword(formData.email, formData.token, formData.newPassword);
      setLoading(false);
      if (res.success) {
        setSuccessMessage('Your password has been reset successfully. You can now log in.');
        setView('login');
        setFormData({
          name: '',
          email: formData.email, // preserve email for convenience
          password: '',
          token: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-slate-50 dark:bg-darkbg-950 font-sans transition-colors duration-300">
      {/* Left side: Visual Branding Column */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-primary-600 via-primary-700 to-secondary-600 relative overflow-hidden flex-col justify-between p-12 text-white bg-grid-pattern">
        {/* Background ambient light bubbles */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-secondary-400/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-400/20 blur-3xl" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <Link to="/" className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-colors">
            <GraduationCap className="h-7 w-7" />
          </Link>
          <span className="font-bold text-2xl tracking-wide">LearnWise AI</span>
        </div>

        {/* Feature Teasers */}
        <div className="my-auto space-y-8 relative z-10 max-w-lg">
          <h2 className="text-4xl font-extrabold leading-tight">
            Personalized exam preparation powered by AI.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Upload your syllabus and marks to unlock custom study schedules, simplified revision notes, streaming chat tutors, and interactive quizzes.
          </p>
          
          <div className="space-y-4 pt-4">
            {[
              "Dynamic calendar personalized to your exam date",
              "Syllabus breakdown with study streak trackers",
              "AI doubt clearing responses streaming in real time"
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <span className="font-medium text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-white/60 text-sm relative z-10">
          © {new Date().getFullYear()} LearnWise AI. Crafted for university excellence.
        </div>
      </div>

      {/* Right side: Input Form Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white transition-all">
              {view === 'login' && 'Welcome Back!'}
              {view === 'register' && 'Create Student Account'}
              {view === 'forgot' && 'Forgot Password?'}
              {view === 'reset' && 'Reset Your Password'}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {view === 'login' && 'Log in to access your study portal.'}
              {view === 'register' && 'Join thousands of students preparing smart.'}
              {view === 'forgot' && 'Enter your email to receive a simulated reset code.'}
              {view === 'reset' && 'Set a new password for your account below.'}
            </p>
          </div>

          {/* Success Alerts */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex flex-col gap-2 text-emerald-600 dark:text-emerald-400">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
                <div className="text-sm font-medium">{successMessage}</div>
              </div>
              {demoCode && (
                <div className="mt-1 p-3 bg-emerald-100/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300/30 text-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold uppercase tracking-wider mb-1">Simulated Reset Code</span>
                  <span className="text-2xl font-mono font-extrabold tracking-widest text-emerald-700 dark:text-emerald-300">{demoCode}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {(authError || localError) && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{localError || authError}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {view === 'register' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-slate-900"
                  />
                </div>
              </div>
            )}

            {(view === 'login' || view === 'register' || view === 'forgot' || view === 'reset') && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">University Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    disabled={view === 'reset'}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@university.edu"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            {(view === 'login' || view === 'register') && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  {view === 'login' && (
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-slate-900"
                  />
                </div>
              </div>
            )}

            {view === 'reset' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Verification Code</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                      <KeyRound className="h-5 w-5" />
                    </span>
                    <input
                      name="token"
                      type="text"
                      required
                      value={formData.token}
                      onChange={handleChange}
                      placeholder="Enter the 6-digit code"
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      name="newPassword"
                      type="password"
                      required
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-slate-900"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {view === 'login' && 'Sign In'}
                    {view === 'register' && 'Sign Up'}
                    {view === 'forgot' && 'Send Reset Code'}
                    {view === 'reset' && 'Reset Password'}
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Navigation/Toggle links at the bottom */}
          <div className="text-center space-y-2">
            {view === 'login' && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                New to LearnWise?{' '}
                <Link to="/register" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  Create account
                </Link>
              </p>
            )}
            {view === 'register' && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  Sign in
                </Link>
              </p>
            )}
            {(view === 'forgot' || view === 'reset') && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Remember your password?{' '}
                <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
