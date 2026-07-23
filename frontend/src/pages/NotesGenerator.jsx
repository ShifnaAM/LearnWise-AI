import React, { useState } from 'react';
import { useApp, API_BASE_URL } from '../context/AppContext';
import { BookOpen, Sparkles, AlertCircle, FileText, Download, CheckSquare, Layers } from 'lucide-react';

const NotesGenerator = () => {
  const { subjects, token, user } = useApp();

  const activeSemester = user?.current_semester || 'Semester 3';
  const activeSubjects = subjects.filter(s => s.semester === activeSemester);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [notesData, setNotesData] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: parseInt(selectedSubjectId),
          topic: customTopic || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setNotesData(data);
        setActiveTab('notes');
      }
    } catch (err) {
      console.error('Error generating notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!notesData) return;
    const textContent = `
=========================================
${notesData.topic_name} - ${notesData.subject_name}
=========================================
NOTES:
${notesData.easy_notes}

BULLET SUMMARY:
${notesData.bullet_summary.map(s => `- ${s}`).join('\n')}

KEY CONCEPTS:
${notesData.key_concepts.map(s => `- ${s}`).join('\n')}

FORMULAS:
${notesData.important_formulas.map(s => `- ${s}`).join('\n')}

EXAM QUESTIONS:
${notesData.exam_topics.map(s => `- ${s}`).join('\n')}
    `;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${notesData.topic_name.replace(/\s+/g, '_')}_Notes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to parse simple markdown to clean HTML elements
  const renderMarkdown = (mdText) => {
    if (!mdText) return null;
    const lines = mdText.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-black text-slate-800 dark:text-white mt-6 mb-3 border-b pb-2">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-5 mb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-bold text-slate-600 dark:text-slate-300 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={idx} className="list-disc ml-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed my-1">{line.replace('- ', '')}</li>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-primary-500 pl-4 py-2 my-4 bg-slate-50 dark:bg-darkbg-900 italic text-slate-600 dark:text-slate-400 text-sm rounded-r-lg">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed my-2">{line}</p>;
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Subject Select Forms */}
      <div className="glass-panel p-6 rounded-3xl">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Select Subject</label>
            <select 
              value={selectedSubjectId}
              required
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
            >
              <option value="">-- Choose Subject --</option>
              {activeSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Topic Name (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Unit 2: Sorting Algorithms" 
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedSubjectId}
            className="py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI Compiling Notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Easy Notes</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Notes Panel */}
      {notesData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Notes Viewer Panel */}
          <div className="lg:col-span-2 glass-panel p-8 rounded-3xl space-y-6 flex flex-col min-h-[500px]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
              <div>
                <h3 className="text-xl font-extrabold">{notesData.topic_name}</h3>
                <span className="text-xs text-slate-400 font-semibold uppercase">{notesData.subject_name}</span>
              </div>
              <button 
                onClick={handleDownload}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-darkbg-800 dark:hover:bg-darkbg-900 border border-slate-200/20 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-center"
              >
                <Download className="h-4 w-4" />
                <span>Download notes</span>
              </button>
            </div>

            {/* Tab layout selectors */}
            <div className="flex gap-2 border-b border-slate-200/40 dark:border-slate-800/40 pb-1">
              {[
                { key: 'notes', label: 'Easy Notes', icon: FileText },
                { key: 'summary', label: 'Bullet Summary & Concepts', icon: Layers },
                { key: 'formulas', label: 'Formulas & Topics', icon: CheckSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                      activeTab === tab.key 
                        ? 'border-primary-500 text-primary-500' 
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto max-h-[600px] pr-2">
              {activeTab === 'notes' && (
                <div className="space-y-4 prose dark:prose-invert max-w-none">
                  {renderMarkdown(notesData.easy_notes)}
                </div>
              )}

              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Bullet summaries */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bullet Summaries</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {notesData.bullet_summary.map((summary, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-darkbg-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl text-sm font-medium">
                          {summary}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key concepts */}
                  <div className="space-y-3 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Definitions / Concepts</h4>
                    <div className="flex flex-wrap gap-2">
                      {notesData.key_concepts.map((concept, idx) => (
                        <span key={idx} className="px-3.5 py-2 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30 text-xs font-semibold rounded-2xl">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'formulas' && (
                <div className="space-y-6">
                  {/* Formulas list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Important Formulas</h4>
                    <div className="space-y-2">
                      {notesData.important_formulas.map((formula, idx) => (
                        <div key={idx} className="p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-2xl border border-white/5 flex items-center justify-between">
                          <span>{formula}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expected questions */}
                  <div className="space-y-3 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expected Exam Topics</h4>
                    <div className="space-y-2.5">
                      {notesData.exam_topics.map((topic, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-darkbg-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl text-xs font-semibold">
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Upload Reference Materials Widget */}
          <div className="p-6 glass-panel rounded-3xl h-fit space-y-4">
            <h4 className="font-bold text-md">AI Notes Context Sources</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate notes utilizing references from syllabus structures or custom uploaded note materials. Visit the uploads portal to configure more materials.
            </p>
            <div className="p-4 bg-slate-50 dark:bg-darkbg-800 rounded-2xl flex items-center gap-3 text-xs">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <span className="font-bold">Active context database</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Syllabus PDF files automatically parsed.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Choose a subject above and click generate to build your personalized easy-to-read notes.</p>
        </div>
      )}

    </div>
  );
};

export default NotesGenerator;
