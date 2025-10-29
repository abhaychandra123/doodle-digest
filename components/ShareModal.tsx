import React, { useState } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface ShareModalProps {
  documentId: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ documentId, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareLink = `https://doodledigest.ai/summary/share-${documentId.slice(-6)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity animate-fade-in"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Share Summary</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Anyone with this link can view the summary.</p>
        
        <div className="mt-6">
          <label htmlFor="share-link" className="text-sm font-medium text-slate-700 dark:text-slate-300 text-left block">
            Shareable Link
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input 
              id="share-link"
              type="text" 
              readOnly 
              value={shareLink} 
              className="flex-1 block w-full rounded-none rounded-l-md border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-slate-600 dark:text-slate-300 text-sm" 
            />
            <button 
              onClick={handleCopy} 
              className={`inline-flex items-center justify-center px-4 rounded-r-md border border-l-0 border-slate-300 text-sm font-medium transition-colors ${
                copied 
                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500'
              } dark:border-slate-600`}
              style={{ minWidth: '100px' }}
            >
              {copied ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2"/> Copied!
                </>
              ) : (
                <>
                  <CopyIcon className="w-4 h-4 mr-2" /> Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500"
          >
            Done
          </button>
        </div>
      </div>
       <style>{`.animate-fade-in { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default ShareModal;