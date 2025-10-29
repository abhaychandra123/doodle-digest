import React, { useState, useCallback, useEffect } from 'react';
import 'react/jsx-runtime';
import { AppView, SummarizerView, User, Document, PdfPage, WritingDocument, Task, GroupDraft } from './types'; // Ensure Task and GroupDraft are in types.ts
import { processPdf } from './services/pdfService';
import { processImage } from './services/imageService';
import {
    generateDoodleSummary,
    generateNotebookSummary,
    generateTotalSummary,
    generateMiniExercise,
    generateCreatorStory,
    suggestImprovements // Keep AI suggestions on frontend for now
} from './services/geminiService';
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

// --- BACKEND INTEGRATION ---
// Define the base URL for your backend API
const API_URL = 'http://localhost:5000/api'; // Make sure this matches your backend port

const App: React.FC = () => {
  // Main application state
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [summarizerView, setSummarizerView] = useState<SummarizerView>(SummarizerView.UPLOAD);

  // Data state - Initialized empty, will be fetched from backend
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [scrollTarget, setScrollTarget] = useState<{ docId: string; pageNumber: number } | null>(null);
  const [writingDocuments, setWritingDocuments] = useState<WritingDocument[]>([]);
  const [activeWritingDocumentId, setActiveWritingDocumentId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]); // Added tasks state

  // Processing state
  const [error, setError] = useState<string>('');
  const [processingMessage, setProcessingMessage] = useState<string>('');

  // Storyfy state
  const [storyfyState, setStoryfyState] = useState<'UPLOAD' | 'PROCESSING' | 'RESULT' | 'ERROR'>('UPLOAD');
  const [storyContent, setStoryContent] = useState<string>('');

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Simplified reset state, backend handles OTP logic
  const [passwordResetEmail, setPasswordResetEmail] = useState<string | null>(null);

  // --- BACKEND INTEGRATION ---
  // Helper to get auth token
  const getAuthToken = useCallback(() => localStorage.getItem('token'), []);

  // --- BACKEND INTEGRATION ---
  // Fetch initial data on app load if token exists
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const fetchInitialData = async () => {
        try {
          // 1. Fetch User Data
          const userRes = await fetch(`${API_URL}/auth/user`, {
            headers: { 'x-auth-token': token }
          });
          if (!userRes.ok) throw new Error('Invalid token');
          const userData = await userRes.json();
          setCurrentUser(userData);
          setView(AppView.DASHBOARD); // Go to dashboard if logged in

          // Fetch other data concurrently
          await Promise.all([
            // 2. Fetch Documents
            fetch(`${API_URL}/documents`, { headers: { 'x-auth-token': token } })
              .then(res => res.ok ? res.json() : [])
              .then(docsData => setDocuments(docsData)),
            // 3. Fetch Writing Documents
            fetch(`${API_URL}/writing`, { headers: { 'x-auth-token': token } })
              .then(res => res.ok ? res.json() : [])
              .then(writingDocsData => setWritingDocuments(writingDocsData)),
            // 4. Fetch Tasks
            fetch(`${API_URL}/tasks`, { headers: { 'x-auth-token': token } })
               .then(res => res.ok ? res.json() : [])
               .then(tasksData => setTasks(tasksData))
          ]);

        } catch (error) {
          console.error("Failed to fetch initial data:", error);
          // Use the logout handler to clear state and redirect
          localStorage.removeItem('token'); // Explicitly remove invalid token
          setCurrentUser(null);
          setDocuments([]);
          setWritingDocuments([]);
          setTasks([]);
          setView(AppView.LOGIN);
        }
      };
      fetchInitialData();
    } else {
        setView(AppView.LOGIN); // Ensure login view if no token
    }
  }, [getAuthToken]); // Added getAuthToken as dependency


  // --- BACKEND INTEGRATION ---
  // Updated Auth Handlers
  const handleRegister = useCallback(async (fullName: string, email: string, password: string): Promise<{ success: boolean, message: string }> => {
    setError(''); // Clear previous errors
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Registration failed');

      localStorage.setItem('token', data.token);

      // Fetch full user data after registration to get defaults
      const fullUserRes = await fetch(`${API_URL}/auth/user`, { headers: { 'x-auth-token': data.token }});
      if (!fullUserRes.ok) throw new Error('Failed to fetch user data after registration');
      const fullUserData = await fullUserRes.json();
      setCurrentUser(fullUserData);

      // Reset data states for new user
      setDocuments([]);
      setWritingDocuments([]);
      setTasks([]);

      setView(AppView.CREATE_PROFILE); // Navigate to create profile
      return { success: true, message: 'Registration successful! Please complete your profile.' };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []); // Empty dependency array as it doesn't depend on component state

  const handleLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean, message: string }> => {
    setError(''); // Clear previous errors
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

      // Fetch user data and other initial data after login
      const [userRes, docsRes, writingDocsRes, tasksRes] = await Promise.all([
         fetch(`${API_URL}/auth/user`, { headers: { 'x-auth-token': token } }),
         fetch(`${API_URL}/documents`, { headers: { 'x-auth-token': token } }),
         fetch(`${API_URL}/writing`, { headers: { 'x-auth-token': token } }),
         fetch(`${API_URL}/tasks`, { headers: { 'x-auth-token': token } })
      ]);

      if (!userRes.ok) throw new Error('Failed to fetch user data after login');
      const userData = await userRes.json();
      setCurrentUser(userData);

      setDocuments(docsRes.ok ? await docsRes.json() : []);
      setWritingDocuments(writingDocsRes.ok ? await writingDocsRes.json() : []);
      setTasks(tasksRes.ok ? await tasksRes.json() : []);

      setView(AppView.DASHBOARD);
      return { success: true, message: 'Login successful!' };
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []); // Empty dependency array

  // Updated Forgot/Reset Password (Frontend only simulates request start)
  const handleForgotPassword = useCallback(async (email: string): Promise<{ success: boolean, message: string }> => {
      setError('');
      if (!email) return { success: false, message: 'Please enter your email.' };
      // TODO: Implement actual API call to backend's forgot password endpoint
      // POST /api/auth/forgot-password with { email }
      console.log(`(Simulated) Password reset request sent for: ${email}`);
      setPasswordResetEmail(email); // Store email to potentially use in reset step
      alert(`(Simulated) If an account exists for ${email}, reset instructions (or OTP) have been sent.`);
      return { success: true, message: 'Password reset initiated.' };
  }, []);

  const handleResetPassword = useCallback(async (otp: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
      setError('');
      if (!passwordResetEmail) return { success: false, message: 'Password reset process not started or email missing.'};
       // TODO: Implement actual API call to backend's reset password endpoint
      // POST /api/auth/reset-password with { email: passwordResetEmail, otp, newPassword }
      console.log(`(Simulated) Resetting password for ${passwordResetEmail} with OTP ${otp}`);
      setPasswordResetEmail(null);
      setView(AppView.LOGIN); // Redirect to login after successful reset
      alert('(Simulated) Password has been reset. Please log in.');
      return { success: true, message: 'Password reset successful.' };
  }, [passwordResetEmail]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setPasswordResetEmail(null);
    setDocuments([]);
    setWritingDocuments([]);
    setTasks([]);
    setActiveDocument(null);
    setError('');
    setView(AppView.LOGIN);
  }, []); // Empty dependency array

  // --- BACKEND INTEGRATION ---
  // Updated Profile Handlers
  const handleProfileCreate = useCallback(async (fullName: string, status: string) => {
    setError('');
    if (!currentUser) return;
    const token = getAuthToken();
    if (!token) return handleLogout();

    try {
        const res = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ fullName, status }), // Send only updated fields
        });
        if (!res.ok) throw new Error('Failed to update profile');
        const updatedUser = await res.json();
        setCurrentUser(updatedUser);
        setView(AppView.DASHBOARD);
    } catch (err: any) {
        setError(err.message);
    }
  }, [currentUser, getAuthToken, handleLogout]);

  const handleUpdateProfile = useCallback(async (updatedUserData: Partial<User>) => {
      setError('');
      if (!currentUser) return;
      const token = getAuthToken();
      if (!token) return handleLogout();

      // Optimistic Update
      const previousUser = currentUser;
      setCurrentUser(prev => ({ ...prev!, ...updatedUserData }));

      try {
          const res = await fetch(`${API_URL}/profile`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
              body: JSON.stringify({ // Send only allowed fields
                  fullName: updatedUserData.fullName,
                  status: updatedUserData.status,
                  integrations: updatedUserData.integrations
              }),
          });
          if (!res.ok) throw new Error('Failed to update profile');
          const finalUser = await res.json();
          setCurrentUser(finalUser); // Update with final data from server
      } catch (err: any) {
          setError(err.message);
          setCurrentUser(previousUser); // Revert on error
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
    // Handle both frontend ID and backend _id
    const doc = documents.find(d => (d.id || (d as any)._id) === docId);
    if (doc) {
      const actualId = doc.id || (doc as any)._id; // Use the actual ID found
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

  // --- BACKEND INTEGRATION ---
  // Updated Onboarding Handler
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
        // Group saved, proceed to dashboard
        setView(AppView.DASHBOARD);
    } catch (err: any) {
        setError("Could not create the group: " + err.message);
        // Keep user on onboarding view to show error
    }
  }, [getAuthToken, handleLogout]);

  // --- BACKEND INTEGRATION ---
  // Updated Document Note Update Handler
  const handleUpdateDocument = useCallback(async (updatedDoc: Document) => {
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();
    // Use _id from MongoDB if available, otherwise fallback to potential frontend id
    const docId = (updatedDoc as any)._id || updatedDoc.id;

    if (!docId) {
        setError("Cannot update document without a valid ID.");
        return;
    }

    // Optimistic UI update
    const previousDocuments = documents;
    setDocuments(prevDocs => prevDocs.map(doc => ((doc as any)._id || doc.id) === docId ? updatedDoc : doc));
    setActiveDocument(updatedDoc);

    try {
      const res = await fetch(`${API_URL}/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ userNotes: updatedDoc.userNotes }), // Only send notes
      });

      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.msg || 'Failed to save notes to server');
      }
      // Success, optimistic update is correct
    } catch (err: any) {
      setError(`Error saving notes: ${err.message}`);
      // Revert optimistic update on failure
      setDocuments(previousDocuments);
      setActiveDocument(previousDocuments.find(d => ((d as any)._id || d.id) === docId) || null);
    }
  }, [documents, getAuthToken, handleLogout]);

  // --- BACKEND INTEGRATION ---
  // Updated Writing Wizard Handlers
  const handleCreateWritingDocument = useCallback(async () => {
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();
    try {
        const res = await fetch(`${API_URL}/writing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify({ title: 'Untitled Document' }) // Backend creates defaults
        });
        if (!res.ok) throw new Error('Failed to create document');
        const newDoc = await res.json();
        setWritingDocuments(prev => [newDoc, ...prev]);
        setActiveWritingDocumentId(newDoc._id); // Use _id from MongoDB response
    } catch (err: any) {
        setError(err.message);
    }
  }, [getAuthToken, handleLogout]);

  const handleUpdateWritingDocument = useCallback(async (updatedDocData: Partial<WritingDocument> & { id: string }) => {
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();
    // Use the passed ID directly (_id from MongoDB)
    const docId = updatedDocData.id;
    if (!docId) {
        setError("Cannot update writing document without ID.");
        return;
    }

    // Optimistic Update
    const previousWritingDocs = writingDocuments;
    const updatedDoc = {
        ...writingDocuments.find(d => (d as any)._id === docId), // Find by _id
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
        // Success
    } catch (err: any) {
        setError(err.message);
        setWritingDocuments(previousWritingDocs); // Revert on error
    }
  }, [writingDocuments, getAuthToken, handleLogout]);

  const handleDeleteWritingDocument = useCallback(async (id: string) => {
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();

    // Optimistic Update
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
        // Success
    } catch (err: any) {
        setError(err.message);
        setWritingDocuments(previousWritingDocs); // Revert
        // If the active doc was deleted and revert happens, reset active ID
        if (activeWritingDocumentId === id) {
             setActiveWritingDocumentId(id);
        }
    }
  }, [activeWritingDocumentId, writingDocuments, getAuthToken, handleLogout]);


  // --- BACKEND INTEGRATION ---
  // Updated Core Processing Logic (handleFileProcessing)
  const handleFileProcessing = useCallback(async (file: File) => {
    if (!file) return;
    setError('');
    const token = getAuthToken();
    if (!token) return handleLogout();

    setSummarizerView(SummarizerView.PROCESSING);
    setProcessingMessage('Starting analysis...'); // Initial message

    try {
      // 1. Frontend AI Processing (as before)
      let pages: PdfPage[];
      if (file.type.startsWith('image/')) {
        setProcessingMessage('Step 1/6: Analyzing document photo...');
        pages = await processImage(file);
      } else if (file.type === 'application/pdf') {
        setProcessingMessage('Step 1/6: Analyzing research paper...');
        pages = await processPdf(file);
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or an image.");
      }

      const fullText = pages.map(p => p.text).join('\n\n');
      if (fullText.trim().length < 50) {
        throw new Error("Document text is too short or text extraction failed. Please try a different file or ensure it's not an image-only PDF.");
      }

      setProcessingMessage('Step 2/6: Generating section summaries...');
      const generatedSummaries = await generateDoodleSummary(pages, (msg) => setProcessingMessage(msg)); // Pass progress updater

      setProcessingMessage('Step 4/6: Compiling your notebook...');
      const finalNotebookSummary = await generateNotebookSummary(generatedSummaries);

      setProcessingMessage('Step 5/6: Creating a final summary...');
      const finalTotalSummary = await generateTotalSummary(generatedSummaries);

      setProcessingMessage('Step 6/6: Building a mini exercise...');
      const finalMiniExercise = await generateMiniExercise(generatedSummaries);

      // 2. Prepare data object to save
      // Note: Saving imageUrls (potentially large base64 strings) to DB might hit size limits.
      // Consider storing images in a separate file storage (like S3, Firebase Storage)
      // and only saving the URL in the DB for production. For now, saving as is.
      const documentToSave = {
        fileName: file.name,
        pdfPages: pages.map(p => ({ pageNumber: p.pageNumber, imageUrl: p.imageUrl, text: p.text })),
        chunkSummaries: generatedSummaries,
        notebookSummary: finalNotebookSummary,
        totalSummary: finalTotalSummary,
        miniExercise: finalMiniExercise,
        userNotes: [],
      };

      setProcessingMessage('Saving your summary to the database...');

      // 3. Send processed data to backend
      const res = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(documentToSave),
      });

      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.msg || 'Failed to save document to server');
      }

      const savedDocument = await res.json();

      // 4. Update frontend state
      setDocuments(prev => [savedDocument, ...prev]);
      setActiveDocument(savedDocument);
      setSummarizerView(SummarizerView.RESULTS);

    } catch (err: any) {
      console.error("File Processing Error:", err);
      setError(`Failed to process the document. ${err.message}`);
      setSummarizerView(SummarizerView.ERROR);
    } finally {
      setProcessingMessage(''); // Clear message on success or error
    }
  }, [getAuthToken, handleLogout]);

  // --- Storyfy Logic (Frontend AI Call) ---
  const handleGenerateStory = useCallback(async (file: File) => {
    if (!file) return;
    setError('');
    const token = getAuthToken(); // Check auth
    if (!token) return handleLogout();

    setStoryfyState('PROCESSING');
    setStoryContent('');
    setProcessingMessage("Reading document for story...");

    try {
      let pages: PdfPage[];
      if (file.type === 'application/pdf') {
        pages = await processPdf(file);
      } else if (file.type.startsWith('image/')) {
        pages = await processImage(file);
      } else {
        throw new Error("Unsupported file type for Storyfy.");
      }

      const fullText = pages.map(p => p.text).join('\n\n');
      if (fullText.trim().length < 100) {
        throw new Error("Document text is too short to generate a story.");
      }

      setProcessingMessage("Crafting the story...");
      const story = await generateCreatorStory(fullText); // Frontend AI call
      setStoryContent(story);
      setStoryfyState('RESULT');

    } catch (err: any) {
      console.error(err);
      setError(`Failed to create story. ${err.message}`);
      setStoryfyState('ERROR');
    } finally {
        setProcessingMessage('');
    }
  }, [getAuthToken, handleLogout]);

  // --- AI Suggestion Logic (Frontend AI Call) ---
  // This function is intended to be passed down to the RichTextEditor
  // It fetches suggestions but doesn't apply them directly here.
  const fetchAISuggestions = useCallback(async (currentContent: string): Promise<string | null> => {
      setError('');
      try {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = currentContent;
          const textContent = tempDiv.textContent || '';
          if (!textContent.trim()) return null;

          const suggestedHtml = await suggestImprovements(textContent); // Frontend AI call
          return suggestedHtml;

      } catch (err: any) {
          setError(`AI Suggestion Error: ${err.message}`);
          return null; // Return null on error
      }
  }, []);


  // --- RENDER LOGIC ---

  const renderSummarizerContent = () => {
    // Make sure we pass the correct ID (_id) to ResultsView
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
            onUpdateDocument={handleUpdateDocument} // Passes the updated doc object
            onReset={handleGoToDashboard}
            onShowNotebook={() => setSummarizerView(SummarizerView.NOTEBOOK)}
            scrollTarget={scrollTarget}
            onClearScrollTarget={() => setScrollTarget(null)}
            />;
        }
        // If activeDocument becomes null unexpectedly, show error/go back
        return <ErrorView message="Could not load summary results. Document not found." onReset={handleGoToDashboard} />;
      case SummarizerView.NOTEBOOK:
        if (activeDocument) { // Use the state variable directly here
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
        // Fallback to upload view
        return <FileUploadView onFileUpload={handleFileProcessing} onBack={handleGoToDashboard} onTakePhoto={() => setSummarizerView(SummarizerView.TAKE_PHOTO)} />;
    }
  };

  const renderContent = () => {
    // Handle loading state while initial token/user check happens
    if (view === AppView.LOGIN && getAuthToken() && currentUser === null) {
        return <div className="flex items-center justify-center h-screen"><ProcessingView message="Loading your dashboard..." /></div>;
    }

    switch(view) {
        case AppView.LOGIN:
            return <AuthView
                        onRegister={handleRegister}
                        onLogin={handleLogin}
                        onForgotPassword={handleForgotPassword}
                        onResetPassword={handleResetPassword}
                    />;
        case AppView.CREATE_PROFILE:
            // Redirect to login if user data is lost somehow
            if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
            return <CreateProfileView onProfileCreate={handleProfileCreate} />;
        case AppView.ONBOARDING:
            // Redirect to login if user data is lost
             if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
            return <OnboardingView onComplete={(groupDraft) => handleOnboardingComplete(groupDraft)} onExit={handleLogout} />;
        case AppView.DASHBOARD:
             if (!currentUser) return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
            return <DashboardView user={currentUser} documents={documents} tasks={tasks} /* Pass tasks */ onStartNew={handleStartNew} onViewDocument={handleViewDocument} onNavigateToProfile={handleGoToProfile} onNavigateToMemory={handleGoToMemory} onNavigateToStoryfy={handleGoToStoryfy} onNavigateToWritingWizard={handleGoToWritingWizard} onLogout={handleLogout} />;
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
                onGenerate={handleGenerateStory}
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
                documents={writingDocuments}
                activeDocumentId={activeWritingDocumentId}
                onSelectDocument={setActiveWritingDocumentId}
                onCreateDocument={handleCreateWritingDocument}
                onUpdateDocument={(doc) => handleUpdateWritingDocument(doc)} // Use the _id provided by backend
                onDeleteDocument={handleDeleteWritingDocument}
                onBack={handleGoToDashboard}
                fetchAISuggestions={fetchAISuggestions} // Pass the suggestion function
            />;
        default:
            // Fallback to login if state is somehow invalid
            return <AuthView onRegister={handleRegister} onLogin={handleLogin} onForgotPassword={handleForgotPassword} onResetPassword={handleResetPassword} />;
    }
  }

  // --- MAIN RENDER ---
  // Adjusted mainClass logic slightly
  const mainClass = view === AppView.LOGIN || view === AppView.CREATE_PROFILE
    ? 'flex-grow flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8' // Center login/profile create
    : 'flex-grow'; // Let other views handle their layout/padding

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#121212]">
      {/* Header rendered based on view */}
      {view !== AppView.LOGIN && view !== AppView.CREATE_PROFILE && <Header user={currentUser} onLogout={handleLogout} />}
      <main className={mainClass}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

