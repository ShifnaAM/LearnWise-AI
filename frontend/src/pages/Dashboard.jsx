import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Flame, 
  Calendar, 
  Clock, 
  CheckSquare, 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  PlusCircle,
  FileText,
  AlertTriangle,
  Award,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, studyPlan, progress, subjects, quizHistory, toggleTopicStatus } = useApp();

  const activeSemester = user?.current_semester || 'Semester 3';
  const activeSubjects = subjects.filter(s => s.semester === activeSemester);

  // Get current day of the week
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = daysOfWeek[new Date().getDay()];

  // Find today's tasks from the study plan
  const getTodayTasks = () => {
    if (!studyPlan || !studyPlan.timetable) return [];
    
    // Find timetable item matching today
    const todayPlan = studyPlan.timetable.find(
      (item) => item.day.toLowerCase() === currentDayName.toLowerCase()
    );
    
    return todayPlan ? todayPlan.tasks : [];
  };

  const todayTasks = getTodayTasks();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Onboarding Callout if no Study Plan generated yet */}
      {!studyPlan && (
        <div className="p-6 bg-gradient-to-r from-primary-600/10 to-secondary-500/10 dark:from-primary-600/20 dark:to-secondary-500/20 border border-primary-500/30 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-primary-600 rounded-2xl text-white">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Setup Your Personalization Form</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Tell us your exam date, subjects, and study hours to generate an AI study timetable and activate streaks.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/personalize')}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 text-sm whitespace-nowrap"
          >
            Create Profile Now
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="p-8 bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 rounded-3xl text-white shadow-xl relative overflow-hidden bg-grid-pattern">
        <div className="absolute top-[-40%] right-[-10%] w-96 h-96 rounded-full bg-secondary-400/20 blur-3xl" />
        <div className="relative z-10 space-y-4">
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            {studyPlan?.learning_goal || "Exam Prep Active"}
          </span>
          <h2 className="text-3xl font-extrabold">Welcome back, {user?.name || "Student"}!</h2>
          <p className="text-white/80 max-w-xl text-sm leading-relaxed">
            {studyPlan 
              ? `You're currently in study mode. Your exam is scheduled on ${studyPlan.exam_date}. Keep up the pace by spending ${studyPlan.study_hours_per_day} hours today.`
              : "Complete your personalization profile and upload your syllabus to start tracking daily metrics."}
          </p>
          {studyPlan && (
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl text-xs font-medium">
                <Calendar className="h-4 w-4" />
                <span>Exam: {studyPlan.exam_date}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl text-xs font-medium">
                <Clock className="h-4 w-4" />
                <span>Goal: {studyPlan.study_hours_per_day} Hours / Day</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Study Streak */}
        <div className="p-6 glass-panel rounded-3xl flex items-center gap-5">
          <div className="p-4 bg-orange-500/10 text-orange-500 rounded-2xl border border-orange-500/20">
            <Flame className="h-8 w-8 fill-current" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block uppercase">Study Streak</span>
            <span className="text-2xl font-black">{progress.study_streak} Days</span>
          </div>
        </div>

        {/* Subjects Count */}
        <div className="p-6 glass-panel rounded-3xl flex items-center gap-5">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20">
            <BookOpen className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block uppercase">Active Subjects</span>
            <span className="text-2xl font-black">{activeSubjects.length} Subjects</span>
          </div>
        </div>

        {/* Percentage Completion */}
        <div className="p-6 glass-panel rounded-3xl flex items-center gap-5 col-span-1 md:col-span-2">
          <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20">
            <Award className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block uppercase">Syllabus Completion</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-black">{progress.percentage_complete}%</span>
              <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progress.percentage_complete}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Tasks & Quick Actions split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Tasks */}
        <div className="lg:col-span-2 p-6 glass-panel rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary-500" />
              <span>Today's Study Task Checklist</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold uppercase">{currentDayName}</span>
          </div>
          
          <div className="space-y-3">
            {todayTasks.length > 0 ? (
              todayTasks.map((task, index) => (
                <div 
                  key={index}
                  className="p-4 bg-slate-50 dark:bg-darkbg-800 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary-500" />
                    <span className="text-sm font-medium">{task}</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold rounded-lg">Active</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No study tasks scheduled for today.</p>
                <Link to="/planner" className="text-primary-500 hover:underline mt-1 block">View Planner Calendar →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions & Recent Scores */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="p-6 glass-panel rounded-3xl space-y-4">
            <h3 className="text-lg font-bold">Quick Academic Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/notes"
                className="p-4 bg-slate-50 dark:bg-darkbg-800 border border-slate-200/50 dark:border-slate-800/85 hover:border-primary-500/40 dark:hover:border-primary-500/40 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <BookOpen className="h-6 w-6 text-purple-500 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Generate Notes</span>
              </Link>
              
              <Link 
                to="/quiz"
                className="p-4 bg-slate-50 dark:bg-darkbg-800 border border-slate-200/50 dark:border-slate-800/85 hover:border-primary-500/40 dark:hover:border-primary-500/40 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <HelpCircle className="h-6 w-6 text-pink-500 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Take a Quiz</span>
              </Link>

              <Link 
                to="/chat"
                className="p-4 bg-slate-50 dark:bg-darkbg-800 border border-slate-200/50 dark:border-slate-800/85 hover:border-primary-500/40 dark:hover:border-primary-500/40 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <MessageSquare className="h-6 w-6 text-indigo-500 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ask doubt (AI)</span>
              </Link>

              <Link 
                to="/upload"
                className="p-4 bg-slate-50 dark:bg-darkbg-800 border border-slate-200/50 dark:border-slate-800/85 hover:border-primary-500/40 dark:hover:border-primary-500/40 rounded-2xl flex flex-col items-center justify-center text-center group transition-all"
              >
                <FileText className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload PDF</span>
              </Link>
            </div>
          </div>

          {/* Recent Quiz Scores */}
          <div className="p-6 glass-panel rounded-3xl space-y-4">
            <h3 className="text-lg font-bold">Recent Quiz Grades</h3>
            <div className="space-y-3">
              {quizHistory.slice(0, 3).map((quiz) => (
                <div key={quiz.id} className="flex justify-between items-center text-sm border-b border-slate-200/40 dark:border-slate-800/40 pb-2">
                  <div>
                    <p className="font-semibold truncate max-w-[150px]">{quiz.quiz_title}</p>
                    <span className="text-xs text-slate-400">{new Date(quiz.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    (quiz.score / quiz.total_questions) >= 0.8 
                      ? 'bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400' 
                      : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {quiz.score}/{quiz.total_questions} ({(quiz.score / quiz.total_questions * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
              
              {quizHistory.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No quiz scores recorded yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
