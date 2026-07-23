import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Flame, CheckCircle, Clock, BookOpen, AlertCircle, TrendingUp, Layers } from 'lucide-react';

const ProgressDashboard = () => {
  const { progress, subjects, toggleTopicStatus, quizHistory, user } = useApp();

  const activeSemester = user?.current_semester || 'Semester 3';
  const activeSubjects = subjects.filter(s => s.semester === activeSemester);

  // Compute average quiz score
  const getAverageScore = () => {
    if (progress.quiz_scores.length === 0) return 0;
    const sum = progress.quiz_scores.reduce((acc, q) => acc + q.score, 0);
    return Math.round(sum / progress.quiz_scores.length);
  };

  const averageScore = getAverageScore();

  // Prepare data for Pie Chart (Completed vs Pending)
  const totalTopicsCount = progress.completed_topics.length + progress.pending_topics.length;
  const pieData = [
    { name: 'Completed', value: progress.completed_topics.length || 0 },
    { name: 'Pending', value: progress.pending_topics.length || 0 }
  ];

  const COLORS = ['#3b82f6', '#1e293b'];

  // Mock list of topics associated with subjects (if progress data is empty)
  // Our backend startup seeds topics like "Unit 1: Fundamentals", etc.
  // We can group topics by matching them dynamically or just showing all progress checklist items.
  const getSubjectTopics = (subId) => {
    // In our simplified database, subjects has relationship to ProgressTracking
    // Let's list general units for visual checklist representation
    return [
      { name: "Unit 1: Fundamentals", status: progress.completed_topics.includes("Unit 1: Fundamentals") ? "completed" : "pending" },
      { name: "Unit 2: Intermediate Analysis", status: progress.completed_topics.includes("Unit 2: Intermediate Analysis") ? "completed" : "pending" },
      { name: "Unit 3: Advanced Applications", status: progress.completed_topics.includes("Unit 3: Advanced Applications") ? "completed" : "pending" }
    ];
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Top Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Streak */}
        <div className="p-6 glass-panel rounded-3xl flex items-center gap-5">
          <div className="p-4 bg-orange-500/10 text-orange-500 rounded-2xl border border-orange-500/20">
            <Flame className="h-6 w-6 fill-current animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block uppercase font-bold">Study Streak</span>
            <span className="text-xl font-black">{progress.study_streak} Days</span>
          </div>
        </div>

        {/* Completed */}
        <div className="p-6 glass-panel rounded-3xl flex items-center gap-5">
          <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl border border-green-500/20">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block uppercase font-bold">Completed Topics</span>
            <span className="text-xl font-black">{progress.completed_topics.length} Units</span>
          </div>
        </div>

        {/* Pending */}
        <div className="p-6 glass-panel rounded-3xl flex items-center gap-5">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl border border-blue-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block uppercase font-bold">Pending Topics</span>
            <span className="text-xl font-black">{progress.pending_topics.length} Units</span>
          </div>
        </div>

        {/* Avg quiz scores */}
        <div className="p-6 glass-panel rounded-3xl flex items-center gap-5">
          <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block uppercase font-bold">Average Grades</span>
            <span className="text-xl font-black">{averageScore}%</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quiz Scores bar chart (col-span 2) */}
        <div className="lg:col-span-2 p-6 glass-panel rounded-3xl space-y-4">
          <h3 className="text-lg font-bold">Academic Assessment History</h3>
          <div className="h-80 w-full text-xs">
            {progress.quiz_scores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progress.quiz_scores}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="quiz_title" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No assessment metrics logged yet. Try taking a quiz!</p>
              </div>
            )}
          </div>
        </div>

        {/* Syllabus Completion pie chart */}
        <div className="p-6 glass-panel rounded-3xl space-y-4 flex flex-col justify-between">
          <h3 className="text-lg font-bold">Overall Completeness</h3>
          <div className="h-56 w-full flex items-center justify-center">
            {totalTopicsCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No subject tracking initialized.</p>
            )}
          </div>
          
          <div className="flex justify-around text-xs pt-4 border-t border-slate-200/20">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded bg-blue-500 block" />
              <span>Completed ({progress.completed_topics.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded bg-slate-800 block" />
              <span>Pending ({progress.pending_topics.length})</span>
            </div>
          </div>
        </div>

      </div>

      {/* Checklist by Subject */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary-500" />
          <span>Interactive Syllabus Completion Checklists</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Toggle completing units to advance your percentage indicators. AI will adapt your study plan timetable priorities in response.
        </p>

        <div className="space-y-6">
          {activeSubjects.map((sub) => {
            const topics = getSubjectTopics(sub.id);
            return (
              <div key={sub.id} className="space-y-3 p-4 bg-slate-50 dark:bg-darkbg-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-800/40 pb-2">
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{sub.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 bg-primary-100 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-bold rounded">
                    {sub.difficulty}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topics.map((t) => (
                    <div 
                      key={t.name}
                      onClick={() => toggleTopicStatus(sub.id, t.name, t.status)}
                      className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        t.status === 'completed' 
                          ? 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-semibold">{t.name}</span>
                      <input 
                        type="checkbox" 
                        checked={t.status === 'completed'}
                        readOnly
                        className="accent-green-500 h-4 w-4 rounded pointer-events-none" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ProgressDashboard;
