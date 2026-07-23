import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus, GraduationCap, ArrowRight } from 'lucide-react';

const AuthChoice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden bg-grid-pattern selection:bg-primary-500 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-[30%] left-[20%] w-[60%] h-[60%] rounded-full bg-primary-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-secondary-600/10 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-primary-600 to-secondary-500 rounded-xl text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xl tracking-wide bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            LearnWise AI
          </span>
        </Link>
        <Link to="/" className="text-slate-400 hover:text-white text-xs font-bold transition-colors">
          Back to Home
        </Link>
      </header>

      {/* Main Container */}
      <div className="my-auto max-w-3xl w-full mx-auto relative z-10 flex flex-col items-center justify-center space-y-12 py-12">
        <div className="text-center space-y-3 max-w-lg">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How would you like to prepare today?
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Access your personalized learning recommendation portal or start fresh by generating study plans from your course syllabus.
          </p>
        </div>

        {/* Choice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Option 1: Login */}
          <button
            onClick={() => navigate('/login')}
            className="p-8 bg-slate-800/40 border border-white/10 rounded-3xl hover:border-primary-500/50 hover:bg-slate-800/80 transition-all duration-300 group text-left flex flex-col justify-between h-64 hover:scale-[1.02] shadow-xl"
          >
            <div className="p-4 bg-primary-500/10 text-primary-400 rounded-2xl border border-primary-500/20 group-hover:bg-primary-500 group-hover:text-white transition-colors self-start">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-1.5">
                <span>Sign In Portal</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Access your active study planner, complete pending topics, and ask study doubts to the AI assistant.
              </p>
            </div>
          </button>

          {/* Option 2: Sign Up */}
          <button
            onClick={() => navigate('/register')}
            className="p-8 bg-slate-800/40 border border-white/10 rounded-3xl hover:border-secondary-500/50 hover:bg-slate-800/80 transition-all duration-300 group text-left flex flex-col justify-between h-64 hover:scale-[1.02] shadow-xl"
          >
            <div className="p-4 bg-secondary-500/10 text-secondary-400 rounded-2xl border border-secondary-500/20 group-hover:bg-secondary-500 group-hover:text-white transition-colors self-start">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-1.5">
                <span>Create Student Account</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                Setup your personalization profile, upload syllabus PDFs, and generate interactive quizzes.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-600 dark:text-slate-500 py-6 max-w-7xl mx-auto w-full border-t border-white/5">
        © {new Date().getFullYear()} LearnWise AI. Secured student access panel.
      </footer>
    </div>
  );
};

export default AuthChoice;
