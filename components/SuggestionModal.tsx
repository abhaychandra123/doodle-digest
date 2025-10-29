import React from 'react';

interface SuggestionModalProps {
  originalContent: string;
  suggestedContent: string;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ originalContent, suggestedContent, onAccept, onReject, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl p-6 sm:p-8 max-w-4xl w-full flex flex-col h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">AI Suggestions</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here are the proposed improvements for your text.</p>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
            <div className="flex flex-col">
                <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-2">Original</h3>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700/50 flex-grow overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: originalContent }}
                />
            </div>
             <div className="flex flex-col">
                <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">Suggestion</h3>
                <div className="p-4 border border-green-300 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-500/10 flex-grow overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: suggestedContent }}
                />
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onReject}
            className="px-5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            Reject
          </button>
          <button
            onClick={onAccept}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500"
          >
            Accept Suggestion
          </button>
        </div>
      </div>
      <style>{`.animate-fade-in { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default SuggestionModal;