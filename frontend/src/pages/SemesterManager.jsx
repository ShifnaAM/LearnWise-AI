import React, { useState, useEffect } from 'react';
import { useApp, API_BASE_URL } from '../context/AppContext';
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Award, 
  ChevronsRight, 
  Flame, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Compass
} from 'lucide-react';

const SemesterManager = () => {
  const { 
    user, 
    subjects, 
    completedSemesters, 
    addSubject, 
    updateSubject, 
    deleteSubject, 
    completeSemester,
    token
  } = useApp();

  const semestersList = Array.from({ length: 8 }).map((_, i) => `Semester ${i + 1}`);
  
  // Local state
  const [selectedSemester, setSelectedSemester] = useState('Semester 3');
  const [branch, setBranch] = useState('Computer Science');
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [justCompletedSem, setJustCompletedSem] = useState('');
  const [nextSemToSetup, setNextSemToSetup] = useState('');

  // Editing subject states
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', difficulty: 'Medium', target_hours: 2.0, marks: '' });

  // Add subject form state
  const [newSubForm, setNewSubForm] = useState({ name: '', difficulty: 'Medium', target_hours: 2.0, marks: '' });

  // Track initial load of user state
  useEffect(() => {
    if (user) {
      if (user.current_semester) {
        setSelectedSemester(user.current_semester);
      }
      if (user.branch) {
        setBranch(user.branch);
      }
    }
  }, [user]);

  // Local state for subjects list of selected semester
  const [semesterSubjects, setSemesterSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchSemesterSubjects = async () => {
      if (!token) return;
      setLoadingSubjects(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await fetch(`${API_BASE_URL}/api/subjects?semester=${selectedSemester}`, { headers });
        if (res.ok && active) {
          setSemesterSubjects(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoadingSubjects(false);
      }
    };
    
    fetchSemesterSubjects();
    return () => { active = false; };
  }, [selectedSemester, subjects, token]);

  // Check if selected semester is completed
  const isCompleted = completedSemesters.some(cs => cs.semester === selectedSemester && cs.status === 'completed');

  // Compute average marks for the semester
  const computeAverageMarks = () => {
    const withMarks = semesterSubjects.filter(s => s.marks !== null && s.marks !== undefined);
    if (withMarks.length === 0) return null;
    const sum = withMarks.reduce((acc, s) => acc + s.marks, 0);
    return Math.round(sum / withMarks.length);
  };

  const averageMarks = computeAverageMarks();

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubForm.name.trim()) return;

    await addSubject({
      name: newSubForm.name,
      branch: branch,
      semester: selectedSemester,
      difficulty: newSubForm.difficulty,
      target_hours: parseFloat(newSubForm.target_hours) || 2.0,
      marks: newSubForm.marks !== '' ? parseFloat(newSubForm.marks) : null
    });

    setNewSubForm({ name: '', difficulty: 'Medium', target_hours: 2.0, marks: '' });
  };

  const handleStartEdit = (subj) => {
    setEditingSubjectId(subj.id);
    setEditFormData({
      name: subj.name,
      difficulty: subj.difficulty,
      target_hours: subj.target_hours,
      marks: subj.marks !== null && subj.marks !== undefined ? subj.marks : ''
    });
  };

  const handleSaveEdit = async (id) => {
    await updateSubject(id, {
      name: editFormData.name,
      branch: branch,
      semester: selectedSemester,
      difficulty: editFormData.difficulty,
      target_hours: parseFloat(editFormData.target_hours),
      marks: editFormData.marks !== '' ? parseFloat(editFormData.marks) : null
    });
    setEditingSubjectId(null);
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm("Are you sure you want to remove this subject?")) {
      await deleteSubject(id);
    }
  };

  const getNextSemesterName = (current) => {
    try {
      const parts = current.split(' ');
      if (parts.length === 2 && parts[0] === 'Semester') {
        const num = parseInt(parts[1]);
        if (num < 8) return `Semester ${num + 1}`;
      }
    } catch (e) {}
    return null;
  };

  const handleCompleteSemester = async () => {
    if (semesterSubjects.length === 0) {
      alert("You cannot complete a semester with no subjects. Please add subjects first.");
      return;
    }

    // Warn if some subjects have no marks
    const missingMarks = semesterSubjects.some(s => s.marks === null || s.marks === undefined);
    if (missingMarks) {
      const confirmProceed = window.confirm(
        "Some subjects in this semester do not have grades/marks entered. Are you sure you want to mark this semester as completed?"
      );
      if (!confirmProceed) return;
    }

    const res = await completeSemester(selectedSemester);
    if (res) {
      const nextSem = getNextSemesterName(selectedSemester);
      setJustCompletedSem(selectedSemester);
      if (nextSem) {
        setNextSemToSetup(nextSem);
        setIsPromptOpen(true);
      } else {
        alert(`Congratulations! You have completed all semesters!`);
      }
    }
  };

  const handleProceedToNextSemester = () => {
    setIsPromptOpen(false);
    if (nextSemToSetup) {
      setSelectedSemester(nextSemToSetup);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Onboarding transition prompt modal */}
      {isPromptOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-darkbg-800 rounded-3xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-700/80 shadow-2xl text-center space-y-6 animate-scale-up">
            <div className="h-16 w-16 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Award className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black">Congratulations!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You have successfully completed <span className="font-bold text-slate-800 dark:text-white">{justCompletedSem}</span> and entered your scores.
              </p>
              <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 rounded-2xl">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">
                  Ready to select and configure the subjects for your next term: <span className="underline font-bold">{nextSemToSetup}</span>?
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsPromptOpen(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darkbg-900"
              >
                Maybe Later
              </button>
              <button 
                onClick={handleProceedToNextSemester}
                className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white text-xs font-extrabold rounded-2xl flex items-center justify-center gap-1 shadow-lg shadow-primary-500/20"
              >
                <span>Let's Go!</span>
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curriculum & Academic Profile config */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-darkbg-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary-500" />
            <span>Academic Term & Grade Center</span>
          </h2>
          <p className="text-xs text-slate-400">Configure subjects, syllabus parameters, and input marks separately for each term.</p>
        </div>

        <div className="flex items-center gap-3">
          <Compass className="h-5 w-5 text-slate-400" />
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Curriculum Path</span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
            >
              <option value="Computer Science">Computer Science Engineering</option>
              <option value="Electrical">Electrical Engineering</option>
              <option value="Mechanical">Mechanical Engineering</option>
              <option value="Civil">Civil Engineering</option>
              <option value="General">Other / General Science</option>
            </select>
          </div>
        </div>
      </div>

      {/* Semesters tabs selector */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-none">
        {semestersList.map((sem) => {
          const isSemCompleted = completedSemesters.some(cs => cs.semester === sem && cs.status === 'completed');
          const isUserCurrent = user?.current_semester === sem;
          
          return (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 border ${
                selectedSemester === sem 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 border-primary-600'
                  : 'bg-white dark:bg-darkbg-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border-slate-200/50 dark:border-slate-800/80'
              }`}
            >
              <span>{sem}</span>
              {isSemCompleted && <CheckCircle2 className="h-4 w-4 text-green-500 fill-current bg-white dark:bg-darkbg-800 rounded-full" />}
              {isUserCurrent && !isSemCompleted && <span className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" title="Current Term" />}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Subject List & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            
            {/* Semester Header Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/40 dark:border-slate-800/40 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{selectedSemester} Subjects</h3>
                  {isCompleted ? (
                    <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-[10px] font-extrabold rounded-lg flex items-center gap-1 uppercase">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold rounded-lg uppercase">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Review your structured subject schedules, targets, and marks outcomes.</p>
              </div>

              {!isCompleted && (
                <button
                  onClick={handleCompleteSemester}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow shadow-green-500/10"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete Semester</span>
                </button>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-darkbg-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Subjects count</span>
                  <span className="text-sm font-black">{semesterSubjects.length} Registered</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-darkbg-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Semester Average</span>
                  <span className="text-sm font-black">
                    {averageMarks !== null ? `${averageMarks}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {loadingSubjects ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
                  <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p>Loading subjects...</p>
                </div>
              ) : (
                <>
                  {semesterSubjects.map((subj) => (
                    <div 
                      key={subj.id}
                      className="p-5 bg-slate-50 dark:bg-darkbg-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-4 transition-all"
                    >
                      {editingSubjectId === subj.id ? (
                        /* Edit Form view */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Subject Name</label>
                              <input 
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="w-full px-3.5 py-2 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Obtained Grade / Mark (%)</label>
                              <input 
                                type="number"
                                max="100"
                                min="0"
                                placeholder="e.g. 85"
                                value={editFormData.marks}
                                onChange={(e) => setEditFormData({ ...editFormData, marks: e.target.value })}
                                className="w-full px-3.5 py-2 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Difficulty</label>
                              <select 
                                value={editFormData.difficulty}
                                onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value })}
                                className="w-full px-3.5 py-2 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-white"
                              >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Study Target (Hours/Day)</label>
                              <input 
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={editFormData.target_hours}
                                onChange={(e) => setEditFormData({ ...editFormData, target_hours: e.target.value })}
                                className="w-full px-3.5 py-2 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingSubjectId(null)}
                              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-[10px] font-bold rounded-lg text-slate-500"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveEdit(subj.id)}
                              className="px-4 py-2 bg-primary-600 text-white text-[10px] font-bold rounded-lg"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display view */
                        <div className="flex justify-between items-center">
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{subj.name}</h4>
                            <div className="flex flex-wrap gap-2 text-[10px]">
                              <span className={`px-2 py-0.5 font-bold rounded ${
                                subj.difficulty === 'Hard' ? 'bg-red-50 dark:bg-red-950/20 text-red-600' :
                                subj.difficulty === 'Medium' ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600' :
                                'bg-green-50 dark:bg-green-950/20 text-green-600'
                              }`}>
                                {subj.difficulty}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium rounded">
                                Target: {subj.target_hours} hrs/day
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Mark / Grade</span>
                              <span className={`text-sm font-black ${subj.marks !== null ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 italic'}`}>
                                {subj.marks !== null ? `${subj.marks}%` : 'Not graded'}
                              </span>
                            </div>

                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => handleStartEdit(subj)}
                                className="p-2 border border-slate-200/50 dark:border-slate-800/80 hover:bg-white dark:hover:bg-darkbg-800 text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-xl"
                                title="Edit Subject"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSubject(subj.id)}
                                className="p-2 border border-red-200/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-xl"
                                title="Delete Subject"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {semesterSubjects.length === 0 && (
                    <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
                      <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No subjects configured for {selectedSemester} yet.</p>
                      <p className="text-xs text-slate-400/80 mt-1">Use the entry form to specify subjects for this term.</p>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Add New Subject Form */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary-500" />
              <span>Add Subject to {selectedSemester}</span>
            </h3>
            
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Subject Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Computer Networks" 
                  value={newSubForm.name}
                  onChange={(e) => setNewSubForm({ ...newSubForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Obtained Mark (%) (Optional)</label>
                <input 
                  type="number" 
                  max="100"
                  min="0"
                  placeholder="e.g. 80 (leave blank if active)" 
                  value={newSubForm.marks}
                  onChange={(e) => setNewSubForm({ ...newSubForm, marks: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Difficulty Scale</label>
                <select 
                  value={newSubForm.difficulty}
                  onChange={(e) => setNewSubForm({ ...newSubForm, difficulty: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-slate-900"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Daily Target (Hours)</label>
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  placeholder="e.g. 2.0" 
                  value={newSubForm.target_hours}
                  onChange={(e) => setNewSubForm({ ...newSubForm, target_hours: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-slate-900"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-extrabold rounded-2xl shadow-lg shadow-primary-500/20 text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Register Subject</span>
              </button>
            </form>
          </div>

          <div className="p-6 glass-panel rounded-3xl space-y-4 text-xs leading-relaxed text-slate-400">
            <h4 className="font-bold text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary-500" />
              <span>How Semester Specifics Work</span>
            </h4>
            <p>
              1. Each semester stores an independent set of subject metrics. Changing semesters will isolate your active checklist.
            </p>
            <p>
              2. Lower grades or higher difficulty values will automatically raise subject importance algorithms within the study planner next time you generate a timetable.
            </p>
            <p>
              3. Tapping "Complete Semester" saves your academic status logs, increments your academic profile level, and prompts subject onboarding for the subsequent term.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SemesterManager;
