import React, { useState, useCallback, useEffect } from 'react';
import 'react/jsx-runtime';
import { AppView, SummarizerView, User, Document, WritingDocument, Task, GroupDraft, Activity, AppStats } from './types';
// --- NEW: Import the refactored services ---
import {
  processFileOnBackend,
  generateCreatorStory,
  suggestImprovements
} from './services/aiService';
import FileUploadView from './components/FileUploadView';
import ProcessingView from './components/ProcessingView';
import ResultsView from './components/ResultsView';
import ErrorView from './components/ErrorView';
import Header from './components/Header';
import NotebookView from './components/NotebookView';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import OnboardingView from './components/OnboardingView';
import CameraView from './components/CameraView';
import ProfileView from './components/ProfileView';
import CreateProfileView from './components/CreateProfileView';
import MemoryView from './components/MemoryView';
import StoryfyView from './components/StoryfyView';
import WritingWizardView from './components/WritingWizardView';

// --- NEW: Get API URL from Vite environment ---
const API_URL = import.meta.env.VITE_API_URL;

const App: React.FC = () => {
  // Main application state
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [summarizerView, setSummarizerView] = useState<SummarizerView>(SummarizerView.UPLOAD);

  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [scrollTarget, setScrollTarget] = useState<{ docId: string; pageNumber: number } | null>(null);
  const [writingDocuments, setWritingDocuments] = useState<WritingDocument[]>([]);
  const [activeWritingDocumentId, setActiveWritingDocumentId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);

  // Processing state
  const [error, setError] = useState<string>('');
  const [processingMessage, setProcessingMessage] = useState<string>('');

  // Storyfy state
  const [storyfyState, setStoryfyState] = useState<'UPLOAD' | 'PROCESSING' | 'RESULT' | 'ERROR'>('UPLOAD');
  const [storyContent, setStoryContent] = useState<string>('');

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [passwordResetEmail, setPasswordResetEmail] = useState<string | null>(null);

  // Helper to get auth token
  const getAuthToken = useCallback(() => localStorage.getItem('token'), []);

  // Fetch initial data on app load if token exists
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const fetchInitialData = async () => {
        try {
          const userRes = await fetch(`${API_URL}/auth/user`, {
            headers: { 'x-auth-token': token }
          });
          if (!userRes.ok) throw new Error('Invalid token');
          const userData = await userRes.json();
          setCurrentUser(userData);
          setView(AppView.DASHBOARD);

          await Promise.all([
            fetch(`${API_URL}/documents`, { headers: { 'x-auth-token': token } })
              .then(res => res.ok ? res.json() : [])
              .then(docsData => setDocuments(docsData)),
            fetch(`${API_URL}/writing`, { headers: { 'x-auth-token': token } })
              .then(res => res.ok ? res.json() : [])
              .then(writingDocsData => setWritingDocuments(writingDocsData)),
            fetch(`${API_URL}/tasks`, { headers: { 'x-auth-token': token } })
              .then(res => res.ok ? res.json() : [])
              .then(tasksData => setTasks(tasksData)),
            fetch(`${API_URL}/activities`, { headers: { 'x-auth-token': token } })
              .then(res => res.ok ? res.json() : [])
              .then(activitiesData => setActivities(activitiesData)),
            fetch(`${API_URL}/stats`, { headers: { 'x-auth-token': token } })
              .then(res => res.ok ? res.json() : null)
              .then(statsData => setStats(statsData))
          ]);

        } catch (error) {
          console.error("Failed to fetch initial data:", error);
          localStorage.removeItem('token');
          setCurrentUser(null);
          setDocuments([]);
          setWritingDocuments([]);
          setTasks([]);
          setActivities([]);
          setStats(null);
          setView(AppView.LOGIN);
        }
      };
      fetchInitialData();
    } else {
      setView(AppView.LOGIN);
    }
  }, [getAuthToken]);


  // --- Auth Handlers ---
  const handleRegister = useCallback(async (fullName: string, email: string, password: string): Promise<{ success: boolean, message: string }> => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Registration failed');

      localStorage.setItem('token', data.token);

      const fullUserRes = await fetch(`${API_URL}/auth/user`, { headers: { 'x-auth-token': data.token } });
      if (!fullUserRes.ok) throw new Error('Failed to fetch user data after registration');
      const fullUserData = await fullUserRes.json();
      setCurrentUser(fullUserData);

      setDocuments([]);
      setWritingDocuments([]);
      setTasks([]);
      setActivities([]);
      setStats(null);

      setView(AppView.CREATE_PROFILE);
      return { success: true, message: 'Registration successful! Please complete your profile.' };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []);

  const handleLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean, message: string }> => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Login failed');

      localStorage.setItem('token', data.token);
      const token = data.token;

      const [userRes, docsRes, writingDocsRes, tasksRes, activitiesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/auth/user`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/documents`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/writing`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/tasks`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/activities`, { headers: { 'x-auth-token': token } }),
        fetch(`${API_URL}/stats`, { headers: { 'x-auth-token': token } })
      ]);

      if (!userRes.ok) throw new Error('Failed to fetch user data after login');
      const userData = await userRes.json();
      setCurrentUser(userData);

      setDocuments(docsRes.ok ? await docsRes.json() : []);
      setWritingDocuments(writingDocsRes.ok ? await writingDocsRes.json() : []);
      setTasks(tasksRes.ok ? await tasksRes.json() : []);
      setActivities(activitiesRes.ok ? await activitiesRes.json() : []);
      setStats(statsRes.ok ? await statsRes.json() : null);

      setView(AppView.DASHBOARD);
      return { success: true, message: 'Login successful!' };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []);

  const handleForgotPassword = useCallback(async (email: string): Promise<{ success: boolean, message: string }> => {
    setError('');
    if (!email) return { success: false, message: 'Please enter your email.' };

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || 'Failed to send reset code');

      setPasswordResetEmail(email);
      return { success: true, message: data.msg || 'If an account exists, a reset code has been sent.' };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []);

  const handleResetPassword = useCallback(async (otp: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    setError('');
    if (!passwordResetEmail) return { success: false, message: 'Password reset process not started or email missing.' };

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: passwordResetEmail, otp, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || 'Failed to reset password');

      setPasswordResetEmail(null);
      setView(AppView.LOGIN);
      return { success: true, message: data.msg || 'Password reset successful!' };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, [passwordResetEmail]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setPasswordResetEmail(null);
    setDocuments([]);
    setWritingDocuments([]);
    setTasks([]);
    setActivities([]);
    setStats(null);
    setActiveDocument(null);
    setError('');
    setView(AppView.LOGIN);
  }, []);

  // --- Profile Handlers ---
  const handleProfileCreate = useCallback(async (fullName: string, status: string) => {
    setError('');
    if (!currentUser) return;
    const token = getAuthToken();
    if (!token) return handleLogout();

    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ fullName, status }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      setView(AppView.DASHBOARD);
      setActivities(prev => [{
        _id: `activity-${Date.now()}`,
        userId: currentUser.id,
        icon: 'profile',
        text: 'Profile created!',
        createdAt: new Date().toISOString()
      }, ...prev]);
    } catch (err: any) {
      setError(err.message);
    }
  }, [currentUser, getAuthToken, handleLogout]);

  const handleUpdateProfile = useCallback(async (updatedUserData: Partial<User>) => {
    setError('');
    if (!currentUser) return;
    const token = getAuthToken();
    if (!token) return handleLogout();

    const previousUser = currentUser;
    setCurrentUser(prev => ({ ...prev!, ...updatedUserData }));

    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
          fullName: updatedUserData.fullName,
          status: updatedUserData.status,
          integrations: updatedUserData.integrations
        }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const finalUser = await res.json();
      setCurrentUser(finalUser);
    } catch (err: any) {
      setError(err.message);
      setCurrentUser(previousUser);
    }
  }, [currentUser, getAuthToken, handleLogout]);

  // --- Navigation Handlers ---
  const handleStartNew = useCallback(() => {
    setActiveDocument(null);
    setSummarizerView(SummarizerView.UPLOAD);
    setView(AppView.SUMMARIZER);
    setError('');
  }, []);

  const handleViewDocument = useCallback((docId: string, options?: { pageNumber?: number }) => {
    const doc = documents.find(d => (d.id || (d as any)._id) === docId);
    if (doc) {
      const actualId = doc.id || (doc as any)._id;
      setActiveDocument(doc);
      if (options?.pageNumber) {
        setScrollTarget({ docId: actualId, pageNumber: options.pageNumber });
      } else {
        setScrollTarget(null);
      }
      setSummarizerView(SummarizerView.RESULTS);
      setView(AppView.SUMMARIZER);
      setError('');
    }
  }, [documents]);

  const handleGoToDashboard = useCallback(() => {
    setActiveDocument(null);
    setError('');
    setView(AppView.DASHBOARD);
  }, []);

  const handleGoToProfile = useCallback(() => setView(AppView.PROFILE), []);
  const handleGoToMemory = useCallback(() => setView(AppView.MEMORY), []);
  const handleGoToStoryfy = useCallback(() => {
    setView(AppView.STORYFY);
    setStoryfyState('UPLOAD');
    setStoryContent('');
    setError('');
  }, []);
  const handleGoToWritingWizard = useCallback(() => setView(AppView.WRITING_WIZARD), []);

  // --- Onboarding Handler ---
  const handleOnboardingComplete = useCallback(async (groupDraft: GroupDraft) => {
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();

    try {
      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(groupDraft),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || 'Failed to save group');
      }
      const savedGroup = await res.json();
      setActivities(prev => [
        {
          _id: `activity-${Date.now()}`,
          userId: savedGroup.ownerId,
          icon: 'group',
          text: `Created a new group: ${savedGroup.name}`,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);

      setView(AppView.DASHBOARD);
    } catch (err: any) {
      setError("Could not create the group: " + err.message);
    }
  }, [getAuthToken, handleLogout]);

  // --- Document Note Update Handler ---
  const handleUpdateDocument = useCallback(async (updatedDoc: Document) => {
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();
    const docId = (updatedDoc as any)._id || updatedDoc.id;

    if (!docId) {
      setError("Cannot update document without a valid ID.");
      return;
    }

    const previousDocuments = documents;
    setDocuments(prevDocs => prevDocs.map(doc => ((doc as any)._id || doc.id) === docId ? updatedDoc : doc));
    setActiveDocument(updatedDoc);

    try {
      const res = await fetch(`${API_URL}/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ userNotes: updatedDoc.userNotes }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || 'Failed to save notes to server');
      }
    } catch (err: any) {
      setError(`Error saving notes: ${err.message}`);
      setDocuments(previousDocuments);
      setActiveDocument(previousDocuments.find(d => ((d as any)._id || d.id) === docId) || null);
    }
  }, [documents, getAuthToken, handleLogout]);

  // --- Writing Wizard Handlers ---
  const handleCreateWritingDocument = useCallback(async () => {
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();
    try {
      const res = await fetch(`${API_URL}/writing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ title: 'Untitled Document' })
      });
      if (!res.ok) throw new Error('Failed to create document');
      const newDoc = await res.json();
      setWritingDocuments(prev => [newDoc, ...prev]);
      setActiveWritingDocumentId(newDoc._id);

      setActivities(prev => [
        {
          _id: `activity-${Date.now()}`,
          userId: newDoc.userId,
          icon: 'writing',
          text: `Started a new document: ${newDoc.title}`,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (err: any) {
      setError(err.message);
    }
  }, [getAuthToken, handleLogout]);

  const handleUpdateWritingDocument = useCallback(async (updatedDocData: Partial<WritingDocument> & { id: string }) => {
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();
    const docId = updatedDocData.id;
    if (!docId) {
      setError("Cannot update writing document without ID.");
      return;
    }

    const previousWritingDocs = writingDocuments;
    const updatedDoc = {
      ...writingDocuments.find(d => (d as any)._id === docId),
      ...updatedDocData,
      lastModified: new Date()
    };
    setWritingDocuments(prev => prev.map(d => (d as any)._id === docId ? updatedDoc : d));

    try {
      const res = await fetch(`${API_URL}/writing/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ title: updatedDoc.title, content: updatedDoc.content })
      });
      if (!res.ok) throw new Error('Failed to update document');
    } catch (err: any) {
      setError(err.message);
      setWritingDocuments(previousWritingDocs);
    }
  }, [writingDocuments, getAuthToken, handleLogout]);

  const handleDeleteWritingDocument = useCallback(async (id: string) => {
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();

    const previousWritingDocs = writingDocuments;
    setWritingDocuments(prev => prev.filter(d => (d as any)._id !== id));
    if (activeWritingDocumentId === id) {
      setActiveWritingDocumentId(null);
    }

    try {
      const res = await fetch(`${API_URL}/writing/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      if (!res.ok) throw new Error('Failed to delete document');
    } catch (err: any) {
      setError(err.message);
      setWritingDocuments(previousWritingDocs);
      if (activeWritingDocumentId === id) {
        setActiveWritingDocumentId(id);
      }
    }
  }, [activeWritingDocumentId, writingDocuments, getAuthToken, handleLogout]);


  // --- NEW: Refactored Core Processing Logic ---
  const handleFileProcessing = useCallback(async (file: File) => {
    if (!file) return;
    setError('');
    setSummarizerView(SummarizerView.PROCESSING);
    setProcessingMessage('Uploading file to secure server...');

    try {
      const savedDocument = await processFileOnBackend(file, (msg) => setProcessingMessage(msg));

      setProcessingMessage('Updating dashboard...');

      // Update frontend state
      setDocuments(prev => [savedDocument, ...prev]);
      setActiveDocument(savedDocument);
      setSummarizerView(SummarizerView.RESULTS);

      // Add to activities feed
      setActivities(prev => [
        {
          _id: `activity-${Date.now()}`,
          userId: savedDocument.userId,
          icon: 'summarizer',
          text: `Summarized the document: ${savedDocument.fileName}`,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);

      // Refresh stats
      const token = getAuthToken();
      if (token) {
        fetch(`${API_URL}/stats`, { headers: { 'x-auth-token': token } })
          .then(res => res.ok ? res.json() : null)
          .then(statsData => setStats(statsData));
      }

    } catch (err: any) {
      console.error("File Processing Error:", err);
      setError(`Failed to process the document. ${err.message}`);
      setSummarizerView(SummarizerView.ERROR);
    } finally {
      setProcessingMessage('');
    }
  }, [getAuthToken]); // Removed handleLogout dependency, it's called internally

  // --- NEW: Refactored Storyfy Logic ---
  const handleGenerateStory = useCallback(async (file: File) => {
    if (!file) return;
    setError('');
    setStoryfyState('PROCESSING');
    setStoryContent('');
    setProcessingMessage("Uploading document for story analysis...");

    try {
      const story = await generateCreatorStory(file);
      setStoryContent(story);
      setStoryfyState('RESULT');

    } catch (err: any) {
      console.error(err);
      setError(`Failed to create story. ${err.message}`);
      setStoryfyState('ERROR');
    } finally {
      setProcessingMessage('');
    }
  }, []); // Removed getAuthToken/handleLogout, service handles it

  // --- NEW: Refactored AI Suggestion Logic ---
  const fetchAISuggestions = useCallback(async (currentContent: string): Promise<string | null> => {
    setError('');
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentContent;
      const textContent = tempDiv.textContent || '';
      if (!textContent.trim()) return null;

      const suggestedHtml = await suggestImprovements(textContent);
      return suggestedHtml;

    } catch (err: any) {
      setError(`AI Suggestion Error: ${err.message}`);
      return null;
    }
  }, []);

  // --- TASK HANDLERS (Unchanged) ---
  const handleAddTask = useCallback(async (text: string) => {
    const token = getAuthToken();
    if (!token || !text.trim()) return;
    const tempId = `task-${Date.now()}`;
    const newTask: Task = { id: tempId, text: text.trim(), completed: false };
    setTasks(prevTasks => [...prevTasks, newTask]);
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save task');
      const savedTask = await res.json();
      setTasks(prevTasks => prevTasks.map(t => t.id === tempId ? { ...savedTask, id: savedTask._id } : t));
    } catch (err) {
      console.error("Failed to add task:", err);
      setError("Failed to save new task.");
      setTasks(prevTasks => prevTasks.filter(t => t.id !== tempId));
    }
  }, [getAuthToken]);

  const handleToggleTask = useCallback(async (taskId: string) => {
    const token = getAuthToken();
    if (!token) return;
    const task = tasks.find(t => (t as any)._id === taskId);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    const previousTasks = tasks;
    setTasks(prevTasks => prevTasks.map(t => (t as any)._id === taskId ? updatedTask : t));
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ completed: updatedTask.completed }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      if (updatedTask.completed) {
        setActivities(prev => [
          {
            _id: `activity-${Date.now()}`,
            userId: (task as any).userId,
            icon: 'task',
            text: `Completed task: ${updatedTask.text}`,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
        fetch(`${API_URL}/stats`, { headers: { 'x-auth-token': token } })
          .then(res => res.ok ? res.json() : null)
          .then(statsData => setStats(statsData));
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
      setError("Failed to update task.");
      setTasks(previousTasks);
    }
  }, [tasks, getAuthToken]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const token = getAuthToken();
    if (!token) return;
    const previousTasks = tasks;
    setTasks(prevTasks => prevTasks.filter(t => (t as any)._id !== taskId));
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token },
      });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task.");
      setTasks(previousTasks);
    }
  }, [getAuthToken, tasks]);


  // --- RENDER LOGIC ---
  const renderSummarizerContent = () => {
    const activeDocForResults = activeDocument ? { ...activeDocument, id: (activeDocument as any)._id || activeDocument.id } : null;
    switch (summarizerView) {
      case SummarizerView.UPLOAD:
        return <FileUploadView onFileUpload={handleFileProcessing} onBack={handleGoToDashboard} onTakePhoto={() => setSummarizerView(SummarizerView.TAKE_PHOTO)} />;
      case SummarizerView.PROCESSING:
        return <ProcessingView message={processingMessage} />;
      case SummarizerView.RESULTS:
        if (activeDocForResults) {
          return <ResultsView
            document={activeDocForResults}
            onUpdateDocument={handleUpdateDocument}
            onReset={handleGoToDashboard}
            onShowNotebook={() => setSummarizerView(SummarizerView.NOTEBOOK)}
            scrollTarget={scrollTarget}
            onClearScrollTarget={() => setScrollTarget(null)}
          />;
        }
        return <ErrorView message="Could not load summary results. Document not found." onReset={handleGoToDashboard} />;
      case SummarizerView.NOTEBOOK:
        if (activeDocument) {
          return <NotebookView
            document={activeDocument}
            onReset={handleGoToDashboard}
            onBack={() => setSummarizerView(SummarizerView.RESULTS)}
          />;
        }
        return <ErrorView message="Could not load notebook. Document not found." onReset={handleGoToDashboard} />;
      case SummarizerView.TAKE_PHOTO:
        return <CameraView onImageCapture={handleFileProcessing} onBack={() => setSummarizerView(SummarizerView.UPLOAD)} />;
      case SummarizerView.ERROR:
        return <ErrorView message={error} onReset={handleGoToDashboard} />;
      default:
        return <FileUploadView onFileUpload={handleFileProcessing} onBack={handleGoToDashboard} onTakePhoto={() => setSummarizerView(SummarizerView.TAKE_PHOTO)} />;
    }
  };

  const renderContent = () => {
    if (view === AppView.LOGIN && getAuthToken() && currentUser === null) {
      return <div className="flex items-center justify-center h-screen"><ProcessingView message="Loading your dashboard..." /></div>;
    }
    switch (view) {
      case AppView.LOGIN:
        return <AuthView
          onRegister={handleRegister}
          onLogin={handleLogin}
          onForgotPassword={handleForgotPassword}
          onResetPassword={handleResetPassword}
        />;
      case AppView.CREATE_PROFILE:
        if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
        return <CreateProfileView onProfileCreate={handleProfileCreate} />;
      case AppView.ONBOARDING:
        if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
        return <OnboardingView onComplete={(groupDraft) => handleOnboardingComplete(groupDraft)} onExit={handleLogout} />;
      case AppView.DASHBOARD:
        if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
        return <DashboardView
          user={currentUser}
          documents={documents}
          tasks={tasks}
          activities={activities}
          stats={stats}
          onStartNew={handleStartNew}
          onViewDocument={handleViewDocument}
          onNavigateToProfile={handleGoToProfile}
          onNavigateToMemory={handleGoToMemory}
          onNavigateToStoryfy={handleGoToStoryfy}
          onNavigateToWritingWizard={handleGoToWritingWizard}
          onLogout={handleLogout}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />;
      case AppView.SUMMARIZER:
        if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
        return renderSummarizerContent();
      case AppView.PROFILE:
        if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
        return <ProfileView user={currentUser} onUpdateProfile={(updatedUser) => handleUpdateProfile(updatedUser)} onBack={handleGoToDashboard} />;
      case AppView.MEMORY:
        if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
        return <MemoryView documents={documents} onOpenNote={handleViewDocument} onBack={handleGoToDashboard} />;
      case AppView.STORYFY:
        if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
        return <StoryfyView
          state={storyfyState}
          storyContent={storyContent}
          error={error}
          onGenerate={handleGenerateStory} // --- NEW: Pass the refactored handler
          onBack={handleGoToDashboard}
          onReset={() => {
            setStoryfyState('UPLOAD');
            setStoryContent('');
            setError('');
          }}
        />;
      case AppView.WRITING_WIZARD:
        if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
        return <WritingWizardView
          documents={writingDocuments.map(d => ({ ...d, id: (d as any)._id }))}
          activeDocumentId={activeWritingDocumentId}
          onSelectDocument={(id) => setActiveWritingDocumentId(id)}
          onCreateDocument={handleCreateWritingDocument}
          onUpdateDocument={(doc) => handleUpdateWritingDocument({ ...doc, id: (doc as any)._id || doc.id })}
          onDeleteDocument={handleDeleteWritingDocument}
          onBack={handleGoToDashboard}
        />;
      default:
        return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
    }
  }

  // --- MAIN RENDER ---
  const mainClass = view === AppView.LOGIN || view === AppView.CREATE_PROFILE
    ? 'flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8'
    : 'flex-grow';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#121212]">
      {view !== AppView.LOGIN && view !== AppView.CREATE_PROFILE && <Header user={currentUser} onLogout={handleLogout} />}
      <main className={mainClass}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
