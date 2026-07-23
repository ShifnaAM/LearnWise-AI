import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, API_BASE_URL } from '../context/AppContext';
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle, Flame, Plus, Trash } from 'lucide-react';

const PersonalizationForm = () => {
  const navigate = useNavigate();
  const { generateStudyPlan, token } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    semester: 'Semester 3',
    branch: 'Computer Science',
    exam_date: '',
    study_hours_per_day: 3,
    learning_goal: 'Improve CGPA',
  });

  const [subjectsList, setSubjectsList] = useState([]);

  const getDefaultSubjects = (branch, semester) => {
    if (branch === 'Computer Science') {
      if (semester === 'Semester 1') {
        return [
          { name: 'Programming in C', mark: 75 },
          { name: 'Mathematics I', mark: 70 },
          { name: 'Physics', mark: 80 }
        ];
      }
      if (semester === 'Semester 2') {
        return [
          { name: 'Object Oriented Programming', mark: 75 },
          { name: 'Mathematics II', mark: 70 },
          { name: 'Chemistry', mark: 80 }
        ];
      }
      if (semester === 'Semester 3') {
        return [
          { name: 'Data Structures & Algorithms', mark: 75 },
          { name: 'Database Management Systems', mark: 80 },
          { name: 'Discrete Mathematics', mark: 70 }
        ];
      }
      if (semester === 'Semester 4') {
        return [
          { name: 'Operating Systems', mark: 80 },
          { name: 'Computer Organization & Architecture', mark: 75 },
          { name: 'Theory of Computation', mark: 70 }
        ];
      }
      return [
        { name: `Advanced ${branch} Topic I`, mark: 75 },
        { name: `Advanced ${branch} Topic II`, mark: 80 }
      ];
    }
    return [
      { name: `Core ${branch} Subject I`, mark: 75 },
      { name: `Core ${branch} Subject II`, mark: 80 }
    ];
  };

  // Load existing subjects or suggest defaults on semester/branch change
  useEffect(() => {
    const fetchExistingSubjects = async () => {
      if (!token) return;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_BASE_URL}/api/subjects?semester=${formData.semester}&branch=${formData.branch}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setSubjectsList(data.map(s => ({
              name: s.name,
              mark: s.marks !== null && s.marks !== undefined ? s.marks : 70
            })));
          } else {
            const defaults = getDefaultSubjects(formData.branch, formData.semester);
            setSubjectsList(defaults);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchExistingSubjects();
  }, [formData.semester, formData.branch, token]);

  const [newSubject, setNewSubject] = useState({ name: '', mark: '' });

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubject.name) return;
    
    setSubjectsList(prev => [...prev, {
      name: newSubject.name,
      mark: newSubject.mark ? parseFloat(newSubject.mark) : 70.0
    }]);
    setNewSubject({ name: '', mark: '' });
  };

  const handleRemoveSubject = (idx) => {
    setSubjectsList(prev => prev.filter((_, i) => i !== idx));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Map lists to schema dictionaries
    const subjects = subjectsList.map(sub => sub.name);
    const previous_marks = {};
    subjectsList.forEach(sub => {
      previous_marks[sub.name] = sub.mark;
    });

    const payload = {
      semester: formData.semester,
      branch: formData.branch,
      subjects: subjects,
      previous_marks: previous_marks,
      exam_date: formData.exam_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Fallback to 30 days out
      study_hours_per_day: parseFloat(formData.study_hours_per_day),
      learning_goal: formData.learning_goal
    };

    const plan = await generateStudyPlan(payload);
    setLoading(false);
    
    if (plan) {
      navigate('/planner');
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Progress Header */}
      <div className="flex justify-between items-center bg-white dark:bg-darkbg-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-400 uppercase">Personalization Progress</span>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <span 
              key={s} 
              className={`h-2.5 w-8 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl space-y-6">
        
        {/* Step 1: Academic Profile */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold">Step 1: Academic Profile</h3>
              <p className="text-xs text-slate-400 mt-1">Provide details about your current university semester course path.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Engineering Branch / Discipline</label>
                <select 
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="Computer Science">Computer Science Engineering</option>
                  <option value="Electrical">Electrical Engineering</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="General">Other / General Science</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Current Semester</label>
                <select 
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 dark:text-white"
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <option key={i} value={`Semester ${i + 1}`}>Semester {i + 1}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Target Exam Date</label>
                <input 
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="button" 
                onClick={nextStep}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl flex items-center gap-1.5 text-sm"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Course Subjects & Prior Marks */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold">Step 2: Course Subjects & Prior Grades</h3>
              <p className="text-xs text-slate-400 mt-1">Specify which subjects you are tracking, along with your latest test percentages.</p>
            </div>

            {/* Subject Input Fields */}
            <form onSubmit={handleAddSubject} className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-darkbg-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subject Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Discrete Math" 
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Previous Score (%)</label>
                <input 
                  type="number" 
                  max="100"
                  min="0"
                  placeholder="e.g. 70" 
                  value={newSubject.mark}
                  onChange={(e) => setNewSubject({ ...newSubject, mark: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
              </div>
              <button 
                type="submit" 
                className="col-span-3 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 mt-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Subject Record</span>
              </button>
            </form>

            {/* List of current subjects */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {subjectsList.map((sub, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-darkbg-800 px-4 py-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
                  <span className="font-semibold text-sm">{sub.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs px-2.5 py-1 bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold rounded-lg">
                      Prev Score: {sub.mark}%
                    </span>
                    <button type="button" onClick={() => handleRemoveSubject(idx)} className="text-red-500 hover:text-red-600">
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button 
                type="button" 
                onClick={prevStep}
                className="px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl flex items-center gap-1.5 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              
              <button 
                type="button" 
                onClick={nextStep}
                disabled={subjectsList.length === 0}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl flex items-center gap-1.5 text-sm disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Habits & Goals */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold">Step 3: Habits & Learning Goals</h3>
              <p className="text-xs text-slate-400 mt-1">Specify how many hours you plan to spend per day, and select your primary outcome goal.</p>
            </div>

            <div className="space-y-6">
              {/* Target study hours slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
                  <span>Target Study Hours Per Day</span>
                  <span className="text-primary-600 dark:text-primary-400 font-extrabold text-sm">{formData.study_hours_per_day} Hours</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={formData.study_hours_per_day}
                  onChange={(e) => setFormData({ ...formData, study_hours_per_day: parseFloat(e.target.value) })}
                  className="w-full accent-primary-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Goal Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Primary Goal</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title: "Pass exam", desc: "Focus strictly on essential concepts and passing marks." },
                    { title: "Improve CGPA", desc: "Balanced schedule targeting high grades." },
                    { title: "Placement preparation", desc: "Deeper analytical coding and core CS concepts focus." }
                  ].map((g) => (
                    <button
                      key={g.title}
                      type="button"
                      onClick={() => setFormData({ ...formData, learning_goal: g.title })}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-36 transition-all ${
                        formData.learning_goal === g.title 
                          ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="font-extrabold text-sm block">{g.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed mt-2">{g.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                type="button" 
                onClick={prevStep}
                className="px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl flex items-center gap-1.5 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              
              <button 
                type="button" 
                disabled={loading}
                onClick={handleSubmit}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-extrabold rounded-2xl shadow-lg shadow-primary-500/20 flex items-center gap-1.5 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Generate AI Plan</span>
                    <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default PersonalizationForm;
