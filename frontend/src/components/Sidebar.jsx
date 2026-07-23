import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  LineChart, 
  Upload, 
  Sun, 
  Moon, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useApp();
  const { isDark, toggleTheme } = useTheme();

  if (!user) return null;

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Materials', path: '/upload', icon: Upload },
    { name: 'Semesters & Grades', path: '/semesters', icon: GraduationCap },
    { name: 'AI Study Planner', path: '/planner', icon: CalendarDays },
    { name: 'AI Notes Gen', path: '/notes', icon: BookOpen },
    { name: 'AI Quiz Gen', path: '/quiz', icon: HelpCircle },
    { name: 'AI Chat Assistant', path: '/chat', icon: MessageSquare },
    { name: 'Progress Analytics', path: '/progress', icon: LineChart },
  ];

  return (
    <aside className="w-64 glass-panel border-r flex flex-col h-screen sticky top-0 transition-colors duration-300 z-20">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-primary-600 rounded-xl text-white">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            LearnWise AI
          </h1>
          <span className="text-xs text-slate-400 dark:text-slate-500">Student Portal</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer with Dark Mode and Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {/* User Card */}
        <div className="flex items-center gap-3 px-2 py-1 mb-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="truncate">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Toggle Dark/Light Mode"
          >
            {isDark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center p-3 rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
