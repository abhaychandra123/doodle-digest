import React from 'react';
import { DoodleBackpackIcon } from './icons/doodles/DoodleBackpackIcon';
import { DoodleBookStackIcon } from './icons/doodles/DoodleBookStackIcon';
import { DoodleLaptopIcon } from './icons/doodles/DoodleLaptopIcon';
import { DoodleLightbulbIcon } from './icons/doodles/DoodleLightbulbIcon';
import { DoodleNotebookIcon } from './icons/doodles/DoodleNotebookIcon';
import { DoodlePencilRulerIcon } from './icons/doodles/DoodlePencilRulerIcon';

interface DoodlePickerModalProps {
  onSelect: (doodleComponent: React.FC<React.SVGProps<SVGSVGElement>>) => void;
  onClose: () => void;
}

const doodles = [
    { Component: DoodleBookStackIcon, name: 'Books' },
    { Component: DoodleLightbulbIcon, name: 'Idea' },
    { Component: DoodleLaptopIcon, name: 'Laptop' },
    { Component: DoodleBackpackIcon, name: 'Backpack' },
    { Component: DoodleNotebookIcon, name: 'Notebook' },
    { Component: DoodlePencilRulerIcon, name: 'Tools' },
];

const DoodlePickerModal: React.FC<DoodlePickerModalProps> = ({ onSelect, onClose }) => {
  
  const handleSelect = (DoodleComponent: React.FC<React.SVGProps<SVGSVGElement>>) => {
    onSelect(DoodleComponent);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Choose an App Doodle</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select one of our study-themed doodles.</p>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          {doodles.map(({ Component, name }) => (
            <button
              key={name}
              onClick={() => handleSelect(Component)}
              className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            >
              <Component className="w-20 h-20" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{name}</span>
            </button>
          ))}
        </div>
        
        <div className="mt-6 text-right">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoodlePickerModal;