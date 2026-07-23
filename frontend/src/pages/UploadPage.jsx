import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Upload, FileText, CheckCircle, Trash, Plus, ShieldCheck, AlertCircle } from 'lucide-react';

const UploadPage = () => {
  const { uploadDoc, documents, addSubject, subjects } = useApp();
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [notesFile, setNotesFile] = useState(null);
  const [notesSubjectId, setNotesSubjectId] = useState('');
  
  // Marks state
  const [marksForm, setMarksForm] = useState({
    subjectName: '',
    marks: '',
  });
  const [manualMarks, setManualMarks] = useState([]);
  
  const [uploadState, setUploadState] = useState({
    syllabus: { loading: false, success: false },
    notes: { loading: false, success: false },
  });

  const handleSyllabusUpload = async (e) => {
    e.preventDefault();
    if (!syllabusFile) return;
    setUploadState(prev => ({ ...prev, syllabus: { loading: true, success: false } }));
    
    const doc = await uploadDoc(syllabusFile, 'syllabus');
    
    setUploadState(prev => ({ ...prev, syllabus: { loading: false, success: !!doc } }));
    if (doc) setSyllabusFile(null);
  };

  const handleNotesUpload = async (e) => {
    e.preventDefault();
    if (!notesFile) return;
    setUploadState(prev => ({ ...prev, notes: { loading: true, success: false } }));
    
    const doc = await uploadDoc(notesFile, 'notes', notesSubjectId ? parseInt(notesSubjectId) : null);
    
    setUploadState(prev => ({ ...prev, notes: { loading: false, success: !!doc } }));
    if (doc) setNotesFile(null);
  };

  const handleAddMark = (e) => {
    e.preventDefault();
    if (!marksForm.subjectName || !marksForm.marks) return;
    
    setManualMarks(prev => [...prev, {
      subjectName: marksForm.subjectName,
      marks: parseFloat(marksForm.marks)
    }]);
    
    setMarksForm({ subjectName: '', marks: '' });
  };

  const handleRemoveMark = (idx) => {
    setManualMarks(prev => prev.filter((_, i) => i !== idx));
  };

  // Convert bytes to formatted string
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Upload Header Alert */}
      <div className="p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/30 rounded-2xl flex items-center gap-3 text-primary-600 dark:text-primary-400">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        <span className="text-xs font-semibold">All uploaded documents are processed securely. AI processing happens locally and on sandboxed backend layers.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Upload Cards */}
        <div className="space-y-8">
          
          {/* Card 1: Syllabus Upload */}
          <div className="p-6 glass-panel rounded-3xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>1. Upload Semester Syllabus (PDF)</span>
            </h3>
            <p className="text-xs text-slate-400">
              The AI uses this PDF to extract course structures, units, and list subjects automatically.
            </p>

            <form onSubmit={handleSyllabusUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-darkbg-900/50 transition-colors">
                <input 
                  type="file" 
                  accept=".pdf" 
                  id="syllabus-file" 
                  className="hidden" 
                  onChange={(e) => setSyllabusFile(e.target.files[0])}
                />
                <label htmlFor="syllabus-file" className="cursor-pointer space-y-2 block">
                  <Upload className="h-8 w-8 mx-auto text-slate-400 dark:text-slate-500" />
                  <span className="font-semibold text-sm block">
                    {syllabusFile ? syllabusFile.name : 'Click to select Syllabus PDF'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-600">Max size: 10MB</span>
                </label>
              </div>

              {syllabusFile && (
                <button
                  type="submit"
                  disabled={uploadState.syllabus.loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploadState.syllabus.loading ? 'Uploading & Parsing...' : 'Process Syllabus'}
                </button>
              )}

              {uploadState.syllabus.success && (
                <div className="flex items-center gap-2 text-green-500 text-xs font-semibold justify-center">
                  <CheckCircle className="h-4 w-4" />
                  <span>Syllabus uploaded & parsed successfully!</span>
                </div>
              )}
            </form>
          </div>

          {/* Card 2: Study Materials Upload */}
          <div className="p-6 glass-panel rounded-3xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <span>2. Upload Study Materials / Textbook notes (PDF)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Attach study materials to specific subjects. The AI Notes and Quiz modules will prioritize reading these details.
            </p>

            <form onSubmit={handleNotesUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Associate with Subject (Optional)</label>
                <select 
                  value={notesSubjectId}
                  onChange={(e) => setNotesSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-slate-900 text-sm"
                >
                  <option value="">-- General Notes (No Association) --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-darkbg-900/50 transition-colors">
                <input 
                  type="file" 
                  accept=".pdf" 
                  id="notes-file" 
                  className="hidden" 
                  onChange={(e) => setNotesFile(e.target.files[0])}
                />
                <label htmlFor="notes-file" className="cursor-pointer space-y-2 block">
                  <Upload className="h-8 w-8 mx-auto text-slate-400 dark:text-slate-500" />
                  <span className="font-semibold text-sm block">
                    {notesFile ? notesFile.name : 'Click to select Notes PDF'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-600">Max size: 20MB</span>
                </label>
              </div>

              {notesFile && (
                <button
                  type="submit"
                  disabled={uploadState.notes.loading}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploadState.notes.loading ? 'Uploading...' : 'Process Study Material'}
                </button>
              )}

              {uploadState.notes.success && (
                <div className="flex items-center gap-2 text-green-500 text-xs font-semibold justify-center">
                  <CheckCircle className="h-4 w-4" />
                  <span>Notes parsed and associated successfully!</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Right Column: Manual Marks Form & Upload Registry */}
        <div className="space-y-8">
          
          {/* Card 3: Previous Marks Manual Entry */}
          <div className="p-6 glass-panel rounded-3xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              <span>3. Previous Academic Performance</span>
            </h3>
            <p className="text-xs text-slate-400">
              Input marks from your previous semesters. Lower scored subjects will automatically receive higher priorities in the Study Planner.
            </p>

            <form onSubmit={handleAddMark} className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <input 
                  type="text" 
                  placeholder="Subject name (e.g. Calculus)" 
                  value={marksForm.subjectName}
                  onChange={(e) => setMarksForm({ ...marksForm, subjectName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
              </div>
              <div>
                <input 
                  type="number" 
                  max="100"
                  min="0"
                  placeholder="Score (%)" 
                  value={marksForm.marks}
                  onChange={(e) => setMarksForm({ ...marksForm, marks: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
              </div>
              <button 
                type="submit" 
                className="col-span-3 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Score Record</span>
              </button>
            </form>

            {/* List of current added marks */}
            <div className="space-y-2 max-h-40 overflow-y-auto pt-2">
              {manualMarks.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-darkbg-800 px-4 py-2.5 rounded-xl text-xs">
                  <span>{m.subjectName}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-orange-600 dark:text-orange-400">{m.marks}%</span>
                    <button type="button" onClick={() => handleRemoveMark(idx)} className="text-red-500 hover:text-red-600">
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {manualMarks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">No manual records added yet.</p>
              )}
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="p-6 glass-panel rounded-3xl space-y-4">
            <h3 className="text-lg font-bold">Uploaded Documents Log</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-4 bg-slate-50 dark:bg-darkbg-800 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`h-6 w-6 ${doc.doc_type === 'syllabus' ? 'text-blue-500' : 'text-purple-500'}`} />
                    <div>
                      <p className="font-bold text-xs truncate max-w-[200px]">{doc.name}</p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {doc.doc_type} • {formatBytes(doc.file_size)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded">Parsed</span>
                </div>
              ))}

              {documents.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No PDF files uploaded yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default UploadPage;
