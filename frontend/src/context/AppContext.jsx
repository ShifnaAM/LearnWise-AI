import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : window.location.origin;

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [studyPlan, setStudyPlan] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [completedSemesters, setCompletedSemesters] = useState([]);
  const [progress, setProgress] = useState({
    completed_topics: [],
    pending_topics: [],
    quiz_scores: [],
    study_streak: 0,
    percentage_complete: 0,
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Automatically fetch user info and dashboard data when token is available
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserData();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user info
      const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) throw new Error('Session expired');
      const userData = await userRes.json();
      setUser(userData);

      // 2. Fetch subjects, planner, docs, history, progress
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [subjectsRes, planRes, docsRes, quizRes, progressRes, semestersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/subjects`, { headers }),
        fetch(`${API_BASE_URL}/api/planner`, { headers }),
        fetch(`${API_BASE_URL}/api/documents`, { headers }),
        fetch(`${API_BASE_URL}/api/quiz/history`, { headers }),
        fetch(`${API_BASE_URL}/api/progress`, { headers }),
        fetch(`${API_BASE_URL}/api/semesters`, { headers }),
      ]);

      if (subjectsRes.ok) setSubjects(await subjectsRes.json());
      if (planRes.ok) {
        const data = await planRes.json();
        setStudyPlan(data);
      }
      if (docsRes.ok) setDocuments(await docsRes.json());
      if (quizRes.ok) setQuizHistory(await quizRes.json());
      if (progressRes.ok) setProgress(await progressRes.json());
      if (semestersRes.ok) setCompletedSemesters(await semestersRes.json());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const login = async (email, password) => {
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to login');
      }
      const data = await res.json();
      setToken(data.access_token);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  };

  const register = async (name, email, password) => {
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Registration failed');
      }
      const data = await res.json();
      setToken(data.access_token);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  };

  const forgotPassword = async (email) => {
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to send reset code');
      }
      const data = await res.json();
      return { success: true, code: data.code };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email, token, newPassword) => {
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, new_password: newPassword }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to reset password');
      }
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setSubjects([]);
    setDocuments([]);
    setStudyPlan(null);
    setQuizHistory([]);
    setCompletedSemesters([]);
    setProgress({
      completed_topics: [],
      pending_topics: [],
      quiz_scores: [],
      study_streak: 0,
      percentage_complete: 0,
    });
    localStorage.removeItem('token');
  };

  // Add a new manual subject
  const addSubject = async (subjectData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subjectData),
      });
      if (res.ok) {
        const newSub = await res.json();
        setSubjects((prev) => [...prev, newSub]);
        fetchDashboardData();
        return newSub;
      }
    } catch (err) {
      console.error('Error adding subject:', err);
    }
  };

  // Update subject details and marks
  const updateSubject = async (subjectId, subjectData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subjectData),
      });
      if (res.ok) {
        const updated = await res.json();
        setSubjects((prev) => prev.map((s) => (s.id === subjectId ? updated : s)));
        fetchDashboardData();
        return updated;
      }
    } catch (err) {
      console.error('Error updating subject:', err);
    }
  };

  // Delete subject
  const deleteSubject = async (subjectId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
        fetchDashboardData();
        return true;
      }
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  // Complete a semester and advance
  const completeSemester = async (semester) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/semesters/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ semester }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
        fetchDashboardData();
        return data;
      }
    } catch (err) {
      console.error('Error completing semester:', err);
    }
  };

  // Upload syllabus or notes PDF
  const uploadDoc = async (file, docType, subjectId = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      if (subjectId) {
        formData.append('subject_id', subjectId);
      }

      const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const newDoc = await res.json();
        setDocuments((prev) => [...prev, newDoc]);
        fetchDashboardData();
        return newDoc;
      }
    } catch (err) {
      console.error('Error uploading document:', err);
    }
  };

  // Generate personalized Study Plan
  const generateStudyPlan = async (plannerReq) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/planner/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(plannerReq),
      });
      if (res.ok) {
        const plan = await res.json();
        setStudyPlan(plan);
        fetchDashboardData();
        return plan;
      }
    } catch (err) {
      console.error('Error generating study plan:', err);
    }
  };

  // Toggle Topic Status
  const toggleTopicStatus = async (subjectId, topicName, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const res = await fetch(`${API_BASE_URL}/api/progress/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject_id: subjectId,
          topic_name: topicName,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error toggling topic status:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        subjects,
        documents,
        studyPlan,
        quizHistory,
        completedSemesters,
        progress,
        loading,
        authError,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        addSubject,
        updateSubject,
        deleteSubject,
        completeSemester,
        uploadDoc,
        generateStudyPlan,
        toggleTopicStatus,
        fetchDashboardData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
