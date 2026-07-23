import React, { useState, useRef, useEffect } from 'react';
import { useApp, API_BASE_URL } from '../context/AppContext';
import { Send, Sparkles, MessageSquare, AlertCircle, Trash, GraduationCap } from 'lucide-react';

const ChatAssistant = () => {
  const { subjects, token, user } = useApp();

  const activeSemester = user?.current_semester || 'Semester 3';
  const activeSubjects = subjects.filter(s => s.semester === activeSemester);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your LearnWise AI study tutor. Choose a subject above, or ask me any question about your syllabus, exam dates, or practice topics!'
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);

    // 1. Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    // 2. Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    // 3. Initiate SSE connection
    let url = `${API_BASE_URL}/api/chat/stream?message=${encodeURIComponent(userMessage)}&token=${encodeURIComponent(token)}`;
    if (selectedSubjectId) {
      url += `&subject_id=${selectedSubjectId}`;
    }

    const eventSource = new EventSource(url);
    let accumulatedText = '';

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.content) {
          // Restore newlines from json mapping
          const textChunk = data.content.replace(/subdata: /g, '\n');
          accumulatedText += textChunk;
          
          // Update last message
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: accumulatedText
            };
            return next;
          });
        }
      } catch (err) {
        console.error('Error parsing stream chunk:', err);
      }
    };

    eventSource.addEventListener('end', () => {
      eventSource.close();
      setIsStreaming(false);
    });

    eventSource.addEventListener('error', (err) => {
      console.error('EventSource error:', err);
      eventSource.close();
      setIsStreaming(false);
      // Fallback message error
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to the AI agent. Please verify that your API backend is active and key settings are correct.'
        };
        return next;
      });
    });
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! Chat history cleared. What topic shall we study next?'
      }
    ]);
  };

  const renderMessageContent = (text) => {
    if (!text) return <span className="inline-block h-4 w-1 bg-primary-500 animate-pulse" />;
    
    // Parse headers, lists, code boxes for premium rendering
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-extrabold text-sm text-slate-800 dark:text-white mt-3 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-extrabold text-md text-slate-800 dark:text-white mt-4 mb-2">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={idx} className="list-disc ml-4 text-xs leading-relaxed my-0.5">{line.replace('- ', '')}</li>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="border-l-4 border-primary-500 pl-3 py-1 my-2 bg-slate-100 dark:bg-darkbg-950 italic text-xs text-slate-500 rounded">{line.replace('> ', '')}</blockquote>;
      }
      return <p key={idx} className="text-xs leading-relaxed my-1">{line}</p>;
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Top Controller */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkbg-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <GraduationCap className="h-5 w-5 text-primary-500" />
          <select 
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none dark:text-white font-bold"
          >
            <option value="">-- General Study Focus --</option>
            {activeSubjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleClearChat}
          className="px-3.5 py-1.5 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-1.5 self-end sm:self-center"
        >
          <Trash className="h-4 w-4" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 glass-panel rounded-3xl p-6 overflow-y-auto space-y-4 flex flex-col">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={index}
              className={`flex items-start gap-3 max-w-[80%] ${
                isUser ? 'self-end flex-row-reverse' : 'self-start'
              }`}
            >
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${
                isUser 
                  ? 'bg-gradient-to-br from-primary-400 to-secondary-500' 
                  : 'bg-primary-600'
              }`}>
                {isUser ? 'ME' : 'AI'}
              </div>
              
              {/* Content Bubble */}
              <div className={`p-4 rounded-3xl shadow-sm border ${
                isUser 
                  ? 'bg-gradient-to-r from-primary-600 to-secondary-500 border-primary-500/20 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-darkbg-800 border-slate-200/50 dark:border-slate-800/80 rounded-tl-none'
              }`}>
                <div className="space-y-1.5 text-xs">
                  {isUser ? <p className="text-xs leading-relaxed">{msg.content}</p> : renderMessageContent(msg.content)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Text Input area */}
      <form onSubmit={handleSend} className="relative">
        <input 
          type="text" 
          value={input}
          disabled={isStreaming}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a doubt or explain a formula... (e.g. What is Master Theorem?)" 
          className="w-full pl-6 pr-14 py-4 bg-white dark:bg-darkbg-800 border border-slate-200 dark:border-slate-800 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-white"
        />
        
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="absolute right-3.5 top-2.5 p-2 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white font-bold rounded-2xl shadow hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
        >
          {isStreaming ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>

    </div>
  );
};

export default ChatAssistant;
