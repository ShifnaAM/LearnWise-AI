import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';

// Component Imports
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page Imports
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import PersonalizationForm from './pages/PersonalizationForm';
import StudyPlanner from './pages/StudyPlanner';
import NotesGenerator from './pages/NotesGenerator';
import QuizGenerator from './pages/QuizGenerator';
import ChatAssistant from './pages/ChatAssistant';
import ProgressDashboard from './pages/ProgressDashboard';
import AuthPage from './pages/AuthPage';
import AuthChoice from './pages/AuthChoice';
import SemesterManager from './pages/SemesterManager';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useApp();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkbg-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { token } = useApp();

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 dark:bg-darkbg-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        {/* Navigation Sidebar (Only for logged-in users) */}
        {token && <Sidebar />}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {token && <Navbar />}
          
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
              <Route path="/login" element={<AuthPage initialView="login" />} />
              <Route path="/register" element={<AuthPage initialView="register" />} />
              <Route path="/forgot-password" element={<AuthPage initialView="forgot" />} />
              <Route path="/get-started" element={<AuthChoice />} />

              {/* Private Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/upload" 
                element={
                  <ProtectedRoute>
                    <UploadPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/personalize" 
                element={
                  <ProtectedRoute>
                    <PersonalizationForm />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/planner" 
                element={
                  <ProtectedRoute>
                    <StudyPlanner />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notes" 
                element={
                  <ProtectedRoute>
                    <NotesGenerator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/quiz" 
                element={
                  <ProtectedRoute>
                    <QuizGenerator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatAssistant />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/progress" 
                element={
                  <ProtectedRoute>
                    <ProgressDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/semesters" 
                element={
                  <ProtectedRoute>
                    <SemesterManager />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback Catch-All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
