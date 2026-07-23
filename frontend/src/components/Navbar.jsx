import React from 'react';
import { useLocation } from 'react-router-dom';
import { Flame, Bell, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Navbar = () => {
  const location = useLocation();
  const { user, progress } = useApp();

  if (!user) return null;

  // Map pathnames to friendly titles
  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/upload': return 'Upload Syllabus & Materials';
      case '/personalize': return 'Personalize Learning Profile';
      case '/planner': return 'AI Personalized Study Planner';
      case '/notes': return 'AI Easy Notes Generator';
      case '/quiz': return 'AI Interactive Quiz Generator';
      case '/chat': return 'AI 24/7 Chat Tutor';
      case '/progress': return 'Detailed Progress Analytics';
      default: return 'LearnWise AI';
    }
  };

  return (
    <header className="h-20 glass-panel border-b flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          {getPageTitle(location.pathname)}
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Welcome back, {user.name.split(' ')[0]}! Ready to excel in your exams?
        </p>
      </div>

      {/* Stats Widgets */}
      <div className="flex items-center gap-6">
        {/* Streak Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
          <Flame className="h-5 w-5 fill-current animate-pulse" />
          <span className="font-bold text-sm">{progress.study_streak} Day Streak</span>
        </div>

        {/* Course Completion Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 dark:text-slate-500">Total Completion</span>
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{progress.percentage_complete}%</p>
          </div>
          <div className="w-24 bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progress.percentage_complete}%` }}
            />
          </div>
        </div>

        {/* Notifications Icon (Mock) */}
        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
