import React, { useState, useMemo } from 'react';
import { WritingDocument } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import RichTextEditor from './RichTextEditor';
import { suggestImprovements } from '../services/aiService';
import SuggestionModal from './SuggestionModal';

interface WritingWizardViewProps {
  documents: WritingDocument[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCreateDocument: () => void;
  onUpdateDocument: (doc: WritingDocument) => void;
  onDeleteDocument: (id: string) => void;
  onBack: () => void;
}

const WritingWizardView: React.FC<WritingWizardViewProps> = ({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCreateDocument,
  onUpdateDocument,
  onDeleteDocument,
  onBack,
}) => {
  const activeDocument = useMemo(() => documents.find(d => d.id === activeDocumentId), [documents, activeDocumentId]);
  
  const [suggestion, setSuggestion] = useState<{ original: string, suggested: string } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeDocument) {
      onUpdateDocument({ ...activeDocument, title: e.target.value });
    }
  };

  const handleContentChange = (content: string) => {
    if (activeDocument) {
      onUpdateDocument({ ...activeDocument, content });
    }
  };

  const handleAISuggest = async () => {
    if (!activeDocument) return;
    setIsSuggesting(true);
    setSuggestion(null);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = activeDocument.content;
      const textContent = tempDiv.textContent || '';
      
      const suggestedText = await suggestImprovements(textContent);
      
      // Basic conversion from markdown-like text to simple HTML
      const suggestedHtml = suggestedText
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => `<p>${line}</p>`)
        .join('');

      setSuggestion({ original: activeDocument.content, suggested: suggestedHtml });
    } catch (error) {
      console.error('AI suggestion failed:', error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (activeDocument && suggestion) {
        onUpdateDocument({ ...activeDocument, content: suggestion.suggested });
    }
    setSuggestion(null);
  };

  return (
    <div className="w-full h-full flex bg-white dark:bg-slate-800">
      {suggestion && (
        <SuggestionModal
            originalContent={suggestion.original}
            suggestedContent={suggestion.suggested}
            onAccept={handleAcceptSuggestion}
            onReject={() => setSuggestion(null)}
            onClose={() => setSuggestion(null)}
        />
      )}
      {/* Documents Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white dark:bg-[#1E1E1E] border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Documents</h2>
            <button
                onClick={onCreateDocument}
                className="flex items-center justify-center p-2 rounded-md text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="New Document"
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-1">
            {documents.map(doc => (
              <li key={doc.id}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectDocument(doc.id);
                  }}
                  className={`group flex flex-col px-3 py-2 rounded-md text-sm transition-colors ${
                    activeDocumentId === doc.id
                      ? 'bg-indigo-100 dark:bg-indigo-500/20'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className={`font-medium truncate ${activeDocumentId === doc.id ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    {doc.title}
                  </span>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${activeDocumentId === doc.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {new Date(doc.lastModified).toLocaleDateString()}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      
      {/* Editor Area */}
      <main className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#121212] p-4 lg:p-8 flex flex-col items-center">
        {activeDocument ? (
          <>
            <div className="w-full max-w-4xl flex-shrink-0 flex justify-between items-center mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 group">
                    <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Dashboard
                </button>
                <div />
            </div>

            <div className="w-full max-w-4xl flex-grow bg-white dark:bg-slate-800 shadow-lg rounded-md flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <input 
                        type="text"
                        value={activeDocument.title}
                        onChange={handleTitleChange}
                        className="w-full bg-transparent text-2xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                </div>
                <RichTextEditor
                    key={activeDocument.id}
                    initialContent={activeDocument.content}
                    onChange={handleContentChange}
                    onAISuggest={handleAISuggest}
                    isSuggesting={isSuggesting}
                />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <DocumentIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
            <h2 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-300">Select a document or create a new one</h2>
            <p className="text-slate-500 dark:text-slate-400">Your writing journey starts here.</p>
            <button
                onClick={onCreateDocument}
                className="mt-6 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
                <PlusIcon className="w-5 h-5" />
                Create New Document
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default WritingWizardView;
