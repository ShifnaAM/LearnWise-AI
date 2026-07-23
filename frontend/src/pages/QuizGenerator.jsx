import React, { useState } from 'react';
import { useApp, API_BASE_URL } from '../context/AppContext';
import { HelpCircle, Sparkles, AlertCircle, Award, CheckCircle2, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const QuizGenerator = () => {
  const { subjects, token, fetchDashboardData, user } = useApp();

  const activeSemester = user?.current_semester || 'Semester 3';
  const activeSubjects = subjects.filter(s => s.semester === activeSemester);
  
  // Selection state
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(3);
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  
  // Quiz play state
  const [answers, setAnswers] = useState({}); // Stores A, B, etc. or written answers
  const [submitted, setSubmitted] = useState(false);
  const [scoreData, setScoreData] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setLoading(true);
    setQuizData(null);
    setAnswers({});
    setSubmitted(false);
    setScoreData(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: parseInt(selectedSubjectId),
          topic: customTopic || null,
          num_questions: parseInt(numQuestions)
        })
      });

      if (res.ok) {
        setQuizData(await res.json());
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleTextChange = (qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    
    // Grade MCQ questions automatically
    let correctCount = 0;
    let totalQuestionsCount = quizData.questions.length;
    const submissionAnswers = [];

    quizData.questions.forEach((q) => {
      const studentAns = answers[q.id] || '';
      let isCorrect = false;
      
      if (q.question_type === 'MCQ') {
        isCorrect = studentAns.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      } else {
        // Simple mock textual similarity grading for short/long answers
        isCorrect = studentAns.length > 5; // Marked as true if they wrote something reasonable
      }

      if (isCorrect) correctCount++;
      
      submissionAnswers.push({
        question_id: q.id,
        student_answer: studentAns,
        is_correct: isCorrect
      });
    });

    // Send score to backend
    try {
      const res = await fetch(`${API_BASE_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: parseInt(selectedSubjectId),
          quiz_title: quizData.quiz_title,
          score: correctCount,
          total_questions: totalQuestionsCount,
          answers: submissionAnswers
        })
      });

      if (res.ok) {
        setScoreData({
          score: correctCount,
          total: totalQuestionsCount,
          percentage: Math.round((correctCount / totalQuestionsCount) * 100)
        });
        setSubmitted(true);
        // Refresh streak and statistics
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error submitting quiz scores:', err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Quiz setup form (Only visible when no quiz is active) */}
      {!quizData && (
        <div className="glass-panel p-8 rounded-3xl space-y-6">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-pink-500" />
              <span>AI Interactive Quiz Generator</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure subjects, scope topics, and test your exam readiness.</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Select Subject</label>
                <select 
                  value={selectedSubjectId}
                  required
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                >
                  <option value="">-- Choose Subject --</option>
                  {activeSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Scope Topic (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Unit 3: Graphs & Trees" 
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
                  <span>Number of Questions</span>
                  <span className="text-primary-500">{numQuestions} Questions</span>
                </div>
                <input 
                  type="range"
                  min="2"
                  max="10"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full accent-primary-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedSubjectId}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-extrabold rounded-2xl shadow-lg shadow-primary-500/20 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI Compiling Assessment...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Compile Assessment</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Quiz Active Play Panel */}
      {quizData && !submitted && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setQuizData(null)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cancel Test</span>
            </button>
            <span className="text-xs text-slate-400 font-semibold uppercase">{quizData.subject_name}</span>
          </div>

          <div className="glass-panel p-8 rounded-3xl space-y-8">
            <h3 className="text-xl font-bold border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
              {quizData.quiz_title}
            </h3>

            {/* Questions stack */}
            <div className="space-y-8">
              {quizData.questions.map((q, idx) => (
                <div key={q.id} className="space-y-4">
                  <h4 className="text-sm font-bold flex items-start gap-2.5">
                    <span className="h-6 w-6 rounded-lg bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{q.question}</span>
                  </h4>

                  {/* Render Options if MCQ */}
                  {q.question_type === 'MCQ' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleOptionSelect(q.id, opt)}
                          className={`p-4 text-left text-xs font-semibold rounded-2xl border transition-all ${
                            answers[q.id] === opt 
                              ? 'border-primary-500 bg-primary-500/10 shadow'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    // Render Textarea for Short/Long answers
                    <div className="pl-8">
                      <textarea
                        rows="3"
                        placeholder="Write your explanation here..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs dark:text-white"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmitQuiz}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-extrabold rounded-2xl shadow-lg shadow-primary-500/20 text-sm flex items-center justify-center gap-2"
            >
              <span>Submit Assessment Answers</span>
            </button>
          </div>
        </div>
      )}

      {/* Quiz Results Panel */}
      {submitted && scoreData && (
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-3xl text-center space-y-6">
            <div className="h-16 w-16 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Award className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black">Assessment Submitted!</h3>
              <p className="text-sm text-slate-400">Your test results have been graded and synced with your database profile.</p>
            </div>

            <div className="text-4xl font-black text-primary-500">
              {scoreData.score} / {scoreData.total}
              <span className="text-xs text-slate-400 block mt-1">({scoreData.percentage}% Score)</span>
            </div>

            <button
              onClick={() => setQuizData(null)}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-darkbg-800 dark:hover:bg-darkbg-900 text-xs font-bold rounded-2xl flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Take Another Test</span>
            </button>
          </div>

          {/* Detailed explanations (Answer Key) */}
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            <h4 className="text-lg font-bold border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
              Detailed Answer Key & AI Feedbacks
            </h4>

            <div className="space-y-6">
              {quizData.questions.map((q, idx) => {
                const studentAns = answers[q.id] || 'Not answered';
                let isCorrect = false;
                if (q.question_type === 'MCQ') {
                  isCorrect = studentAns.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                } else {
                  isCorrect = studentAns.length > 5;
                }

                return (
                  <div key={q.id} className="space-y-3 pb-6 border-b border-slate-200/20 last:border-b-0 last:pb-0">
                    <h5 className="text-sm font-bold flex items-start gap-2.5">
                      <span className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{q.question}</span>
                    </h5>

                    {/* Result Banner */}
                    <div className="pl-8 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>Correct answer</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="h-4 w-4 shrink-0" />
                            <span>Incorrect choice</span>
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-darkbg-900 rounded-2xl space-y-1.5 text-xs">
                        <p className="text-slate-400">Your Selection: <span className="font-semibold text-slate-800 dark:text-slate-200">{studentAns}</span></p>
                        <p className="text-slate-400">Correct Value: <span className="font-semibold text-green-600 dark:text-green-400">{q.correct_answer}</span></p>
                        <div className="border-t border-slate-200/30 pt-2 text-slate-500 leading-relaxed font-semibold">
                          <span className="font-bold text-[10px] text-slate-400 block uppercase mb-1">AI Explanation</span>
                          {q.explanation || 'Graded on key matches.'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Landing selection explanation when no subjects loaded */}
      {activeSubjects.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No active subjects configured. Add subjects first using the Personalization Form or Upload page.</p>
        </div>
      )}

    </div>
  );
};

export default QuizGenerator;
