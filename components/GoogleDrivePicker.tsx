import React, { useState } from 'react';
import { FilePdfIcon } from './icons/FilePdfIcon';

interface GoogleDrivePickerProps {
  onClose: () => void;
}

const mockFiles = [
  { id: '1', name: 'Quantum_Entanglement_Review_2023.pdf', owner: 'Jane Doe', modified: 'Mar 15, 2024' },
  { id: '2', name: 'CRISPR_Gene_Editing_Advances.pdf', owner: 'You', modified: 'Feb 28, 2024' },
  { id: '3', name: 'AI_Ethics_in_Healthcare_Final.pdf', owner: 'John Smith', modified: 'Jan 10, 2024' },
  { id: '4', name: 'Materials_Science_Graphene.pdf', owner: 'You', modified: 'Dec 5, 2023' },
];

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onClose }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const handleSelect = () => {
    if (selectedFileId) {
      alert(`Simulated file selection! In a real app, '${mockFiles.find(f => f.id === selectedFileId)?.name}' would be processed. This feature is for demonstration only.`);
      onClose();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl max-w-2xl w-full flex flex-col h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Select a PDF from Google Drive</h2>
        </div>
        
        <div className="flex-grow overflow-y-auto">
            <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Name</th>
                        <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Owner</th>
                        <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Last Modified</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {mockFiles.map(file => (
                        <tr 
                            key={file.id} 
                            onClick={() => setSelectedFileId(file.id)}
                            className={`cursor-pointer ${selectedFileId === file.id ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            <td className="p-3 flex items-center gap-3">
                                <FilePdfIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</span>
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400">{file.owner}</td>
                            <td className="p-3 text-slate-500 dark:text-slate-400">{file.modified}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
                Cancel
            </button>
            <button 
                onClick={handleSelect} 
                disabled={!selectedFileId}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Select
            </button>
        </div>
      </div>
       <style>{`.animate-fade-in { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};

export default GoogleDrivePicker;