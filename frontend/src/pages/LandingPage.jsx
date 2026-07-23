import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Calendar, BookOpen, HelpCircle, MessageSquare, ArrowRight, Sparkles, CheckCircle, ShieldAlert } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      title: "AI Study Planner",
      desc: "Get a highly customized daily timetable based on your exam date, target grades, and hours available.",
      icon: Calendar,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    },
    {
      title: "AI Notes Generator",
      desc: "Transform complex textbook syllabus text into simple summaries, concept bullet-points, and core formulas.",
      icon: BookOpen,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
    },
    {
      title: "AI Quiz Generator",
      desc: "Assess your level with dynamically generated multiple-choice and descriptive questions with instant feedback.",
      icon: HelpCircle,
      color: "bg-pink-500/10 text-pink-500 border-pink-500/20"
    },
    {
      title: "AI Streaming Doubt Solver",
      desc: "Ask doubts directly to our AI Chat tutor. Responses stream back in real time like having a private instructor.",
      icon: MessageSquare,
      color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-primary-500 selection:text-white relative overflow-hidden bg-grid-pattern">
      {/* Ambient background blur blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[45%] rounded-full bg-secondary-600/10 blur-[150px] pointer-events-none" />

      {/* Header/Navbar */}
      <header className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-primary-600 to-secondary-500 rounded-xl text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xl tracking-wide bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            LearnWise AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-slate-300 hover:text-white font-semibold transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link 
            to="/get-started" 
            className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center relative z-10 flex flex-col items-center">
        {/* Banner Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-slate-300 text-sm font-semibold mb-8 animate-pulse">
          <Sparkles className="h-4 w-4 text-secondary-400" />
          <span>Next-Generation Personalized Exam Prep</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Master Your University Syllabus with{" "}
          <span className="bg-gradient-to-r from-primary-400 via-primary-500 to-secondary-400 bg-clip-text text-transparent">
            Personalized AI
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          LearnWise AI analyzes your syllabus, tracks your previous marks, and crafts a bespoke study planner, key revision notes, and targeted practice quizzes.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/get-started"
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-extrabold rounded-2xl shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span>Launch Your Study Plan</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Sign In with Portal
          </Link>
        </div>

        {/* Mock Mockup Visual */}
        <div className="mt-20 w-full max-w-5xl rounded-2xl border border-white/10 bg-slate-800/40 p-3 backdrop-blur-md shadow-2xl relative">
          <div className="absolute -top-3 -left-3 w-16 h-16 border-t-2 border-l-2 border-primary-500 rounded-tl-xl pointer-events-none" />
          <div className="absolute -bottom-3 -right-3 w-16 h-16 border-b-2 border-r-2 border-secondary-500 rounded-br-xl pointer-events-none" />
          
          <div className="rounded-xl overflow-hidden border border-white/5 bg-slate-900 aspect-[16/9] flex flex-col">
            {/* Mock Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-white/5 flex items-center justify-between text-xs text-slate-500">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/40" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <span className="w-3 h-3 rounded-full bg-green-500/40" />
              </div>
              <span className="font-semibold text-slate-400">learnwise-ai-dashboard.edu</span>
              <div className="w-6" />
            </div>
            
            {/* Mock Dashboard Visual */}
            <div className="flex-1 p-6 grid grid-cols-3 gap-4 text-left text-sm bg-slate-900/90 overflow-hidden">
              {/* Left Mock Panel */}
              <div className="col-span-2 space-y-4">
                <div className="p-4 bg-slate-800/50 border border-white/5 rounded-xl space-y-2">
                  <div className="h-4 w-1/4 bg-primary-500/30 rounded" />
                  <div className="h-8 w-3/4 bg-slate-700/50 rounded" />
                  <div className="flex gap-2 pt-2">
                    <span className="h-5 w-16 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 text-[10px] flex items-center justify-center font-bold">Streak: 7 Days</span>
                    <span className="h-5 w-24 bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30 text-[10px] flex items-center justify-center font-bold">Goal: Improve CGPA</span>
                  </div>
                </div>
                {/* Visual Chart Bars */}
                <div className="p-4 bg-slate-800/30 border border-white/5 rounded-xl space-y-3">
                  <div className="h-4 w-1/3 bg-slate-700/50 rounded" />
                  <div className="space-y-2">
                    {[
                      { label: "Data Structures & Algos", val: "78%" },
                      { label: "Discrete Mathematics", val: "54%" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{item.label}</span>
                        <div className="flex items-center gap-2 flex-1 mx-4">
                          <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary-500 h-full rounded-full" style={{ width: item.val }} />
                          </div>
                        </div>
                        <span className="text-slate-300 font-bold">{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Right Mock Panel */}
              <div className="p-4 bg-slate-800/50 border border-white/5 rounded-xl flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-1/2 bg-slate-700/50 rounded" />
                  <div className="space-y-1">
                    <div className="h-3 w-full bg-slate-700/30 rounded" />
                    <div className="h-3 w-5/6 bg-slate-700/30 rounded" />
                    <div className="h-3 w-4/5 bg-slate-700/30 rounded" />
                  </div>
                </div>
                <div className="p-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg text-center text-xs font-bold text-white">
                  Generating AI Notes...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold">All-in-One Exam Success Suite</h2>
          <p className="text-slate-400 mt-3 text-sm">
            Tackle complex college semesters with modern automated modules designed for high academic performance.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div 
                key={index} 
                className="p-8 bg-slate-800/30 border border-white/5 rounded-2xl hover:border-slate-700 transition-all duration-300 flex items-start gap-5 hover:scale-[1.01]"
              >
                <div className={`p-4 rounded-xl border ${feat.color} shrink-0`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{feat.title}</h3>
                  <p className="text-slate-400 mt-2 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* About System Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-white/5 bg-slate-950/20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold">Engineered for Universities</h2>
          <p className="text-slate-400 leading-relaxed text-sm">
            LearnWise AI bridges the gap between massive syllabus textbooks and optimized study routines. By taking into account your exam calendar and current knowledge scores, our algorithms construct target workloads that fits into your day without burning out.
          </p>
          <div className="flex flex-wrap justify-center gap-8 pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-sm">Clean JWT Auth Security</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-sm">SQLite Offline-friendly DB</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-sm">Dockerized & App Runner Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 relative z-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">LearnWise AI</span>
          <span>Crafted for University & College Students. Prepared with FastAPI & React.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
