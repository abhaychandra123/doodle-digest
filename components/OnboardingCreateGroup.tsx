import React, { useState, useEffect } from 'react';
import { useOnboardingState } from './OnboardingView';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface OnboardingStepProps {
  nextStep: () => void;
  exit: () => void;
}

const OnboardingCreateGroup: React.FC<OnboardingStepProps> = ({ nextStep, exit }) => {
  const { groupDraft, setGroupDraft } = useOnboardingState();
  const [name, setName] = useState(groupDraft.name);
  const [description, setDescription] = useState(groupDraft.description);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(name.trim().length >= 3 && description.trim().length >= 10);
  }, [name, description]);

  const handleNext = () => {
    if (isValid) {
      setGroupDraft(prev => ({ ...prev, name, description }));
      nextStep();
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Create a Research Group</h2>
      <p className="text-slate-600 dark:text-slate-400 mt-1">Start by giving your new collaborative space a name and purpose.</p>
      
      <div className="mt-8 space-y-6">
        <div>
          <label htmlFor="groupName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Write your Group Name</label>
          <input
            id="groupName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full input-style"
            placeholder="e.g., AI Drug Discovery"
          />
        </div>
        <div>
          <label htmlFor="groupDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Describe your Group</label>
          <textarea
            id="groupDescription"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full input-style"
            placeholder="e.g., Our group focuses on developing GRISPR-based therapies..."
          />
        </div>
      </div>

      <div className="mt-10 flex justify-between items-center">
        <button onClick={exit} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeftIcon className="w-4 h-4" />
          Exit Setup
        </button>
        <button
          onClick={handleNext}
          disabled={!isValid}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      <style>{`
        .input-style {
          color: #1f2937; /* gray-800 */
          background-color: #ffffff;
          box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.07);
          border: 1px solid #cbd5e1; /* slate-300 */
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          width: 100%;
        }
        .dark .input-style {
          color: #f3f4f6; /* gray-100 */
          background-color: #374151; /* gray-700 */
          border-color: #4b5563; /* gray-600 */
        }
        .input-style:focus {
          outline: none;
          border-color: #6366f1; /* indigo-500 */
          box-shadow: 0 0 0 1px #6366f1;
        }
        .dark .input-style:focus {
          border-color: #818cf8; /* indigo-400 */
          box-shadow: 0 0 0 1px #818cf8;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default OnboardingCreateGroup;