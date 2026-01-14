import React, { useMemo } from 'react';
import ProcessingView from './ProcessingView';
import ErrorView from './ErrorView';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { UploadIcon } from './icons/UploadIcon';
import { sanitizeHtml } from '../utils/sanitizeHtml';

declare const marked: any;

// A self-contained upload component for Storyfy
const StoryUpload: React.FC<{ onFile: (file: File) => void; onBack: () => void; }> = ({ onFile, onBack }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFile(e.target.files[0]);
    }
  };
  
  const InputOption: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
  }> = ({ icon, title, description, onClick, children, disabled }) => (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative group bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 text-center flex flex-col items-center shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 cursor-pointer hover:shadow-lg'}`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-black dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      {children}
    </div>
  );

  return (
    <div className="w-full max-w-4xl text-center">
       <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 group"
      >
        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </button>
      <h2 className="text-3xl font-bold font-doodle tracking-tight text-black dark:text-white sm:text-4xl">
        Discover the Story
      </h2>
      <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
        Upload a paper, and we'll tell you the story of the brilliant minds behind the ideas.
      </p>
      
      <div className="mt-10 grid grid-cols-1 md:grid-cols-1 gap-6">
        <InputOption
          icon={<UploadIcon className="w-8 h-8 text-indigo-500" />}
          title="From Device"
          description="Upload a PDF or image from your computer."
          onClick={() => window.document.getElementById('story-file-upload')?.click()}
        >
          <input
            id="story-file-upload"
            name="story-file-upload"
            type="file"
            accept=".pdf,image/*"
            className="sr-only"
            onChange={handleFileChange}
          />
        </InputOption>
      </div>
    </div>
  );
};

// Component to display the final story
const StoryResult: React.FC<{ content: string; onReset: () => void; }> = ({ content, onReset }) => {
  const htmlContent = useMemo(() => {
    if (typeof marked === 'undefined' || !content) return '';
    return sanitizeHtml(marked.parse(content));
  }, [content]);

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold font-doodle text-black dark:text-white">The Story Behind the Science</h2>
        <button 
          onClick={onReset} 
          className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
        >
          Analyze Another Paper
        </button>
      </div>
      <div className="bg-white dark:bg-[#1E1E1E] p-8 sm:p-12 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="story-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
       <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

// Main component for the Storyfy feature
interface StoryfyViewProps {
  state: 'UPLOAD' | 'PROCESSING' | 'RESULT' | 'ERROR';
  storyContent: string;
  error: string;
  onGenerate: (file: File) => void;
  onBack: () => void;
  onReset: () => void;
}

const StoryfyView: React.FC<StoryfyViewProps> = ({ state, storyContent, error, onGenerate, onBack, onReset }) => {
  switch (state) {
    case 'UPLOAD':
      return <StoryUpload onFile={onGenerate} onBack={onBack} />;
    case 'PROCESSING':
      return <ProcessingView message="Reading the paper and discovering the human story behind the science..." />;
    case 'RESULT':
      return <StoryResult content={storyContent} onReset={onReset} />;
    case 'ERROR':
      return <ErrorView message={error} onReset={onBack} />;
    default:
      return <StoryUpload onFile={onGenerate} onBack={onBack} />;
  }
};

export default StoryfyView;
