import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, BookOpen, AlertCircle, ArrowRight, Settings, CheckSquare } from 'lucide-react';

const StudyPlanner = () => {
  const navigate = useNavigate();
  const { studyPlan } = useApp();
  const [activeDay, setActiveDay] = useState('Monday');

  if (!studyPlan) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-6 animate-fade-in mt-12">
        <div className="p-8 glass-panel rounded-3xl space-y-4">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-bold">No Study Plan Active</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Before we can generate your study timetable, you need to complete the personalization onboarding form.
          </p>
          <button 
            onClick={() => navigate('/personalize')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 text-sm inline-flex items-center gap-2"
          >
            <span>Create Personalized Plan</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Find active day structure
  const activeDayPlan = studyPlan.timetable.find(
    (item) => item.day.toLowerCase() === activeDay.toLowerCase()
  ) || studyPlan.timetable[0];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Planner Header Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkbg-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-500" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Target Exam Date</span>
              <span className="font-bold">{studyPlan.exam_date}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary-500" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Study Hours Target</span>
              <span className="font-bold">{studyPlan.study_hours_per_day} Hrs/Day</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-500" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Core Goal Path</span>
              <span className="font-bold capitalize">{studyPlan.learning_goal}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate('/personalize')}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-darkbg-900 text-xs font-bold rounded-xl flex items-center gap-1.5"
        >
          <Settings className="h-4 w-4" />
          <span>Adjust Schedule</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Weekly Timetable Tab layout */}
        <div className="lg:col-span-2 space-y-6">
          {/* Day selection tabs */}
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-none">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeDay === day 
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white dark:bg-darkbg-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Active Day details */}
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
              <h3 className="text-xl font-bold">{activeDay}'s Strategy</h3>
              <span className="text-xs px-2.5 py-1 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold rounded-lg uppercase">
                Active Study Day
              </span>
            </div>

            {/* Timetable checklist */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Tasks</h4>
              <div className="space-y-3">
                {activeDayPlan.tasks.map((task, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-darkbg-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl flex items-start gap-3">
                    <input type="checkbox" className="mt-1 accent-primary-500 h-4 w-4 cursor-pointer rounded" />
                    <span className="text-sm font-medium leading-relaxed">{task}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject priorities & Hours breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
              {/* Priorities list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Priorities</h4>
                <div className="space-y-2">
                  {Object.entries(activeDayPlan.subject_priorities).map(([subj, prio]) => (
                    <div key={subj} className="flex justify-between items-center text-xs">
                      <span>{subj}</span>
                      <span className={`px-2.5 py-0.5 rounded font-bold uppercase text-[10px] ${
                        prio.toLowerCase().includes('high') 
                          ? 'bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                          : prio.toLowerCase().includes('medium')
                          ? 'bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
                          : 'bg-green-100 dark:bg-green-950/20 text-green-600 dark:text-green-400'
                      }`}>
                        {prio}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hours details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hours Allocation</h4>
                <div className="space-y-2">
                  {Object.entries(activeDayPlan.hours_allocated).map(([subj, hrs]) => (
                    <div key={subj} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{subj}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{hrs} Hours</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full rounded-full" 
                          style={{ width: `${(hrs / studyPlan.study_hours_per_day) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Weekly goals & Revision checkpoints */}
        <div className="space-y-8">
          
          {/* Weekly goals */}
          <div className="p-6 glass-panel rounded-3xl space-y-4">
            <h3 className="text-lg font-bold">Weekly Milestones</h3>
            <div className="space-y-3">
              {studyPlan.weekly_goals.map((goal, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-darkbg-800 rounded-2xl text-xs leading-relaxed font-semibold border border-slate-200/20">
                  {goal}
                </div>
              ))}
            </div>
          </div>

          {/* Revision schedule */}
          <div className="p-6 glass-panel rounded-3xl space-y-4">
            <h3 className="text-lg font-bold">Revision Checkpoints</h3>
            <div className="space-y-3">
              {studyPlan.revision_schedule.map((rev, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-darkbg-800 rounded-2xl text-xs leading-relaxed font-semibold border border-slate-200/20">
                  {rev}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default StudyPlanner;
