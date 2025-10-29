import React, { useState, useEffect } from 'react';
import { useOnboardingState } from './OnboardingView';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface OnboardingStepProps {
  nextStep: () => void;
  prevStep: () => void;
}

const researchCategories = [
  'Artificial Intelligence', 'Robotics', 'Computer Vision', 'NLP', 'Quantum Computing',
  'Biology', 'Chemistry', 'Physics', 'Social Science', 'Economics', 'Healthcare', 'Other'
];

const OnboardingPurpose: React.FC<OnboardingStepProps> = ({ nextStep, prevStep }) => {
  const { groupDraft, setGroupDraft } = useOnboardingState();
  const [purpose, setPurpose] = useState(groupDraft.purpose);
  const [categories, setCategories] = useState<string[]>(groupDraft.categories);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(purpose.trim().length >= 10 && categories.length > 0);
  }, [purpose, categories]);

  const handleCategoryToggle = (category: string) => {
    setCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleNext = () => {
    if (isValid) {
      setGroupDraft(prev => ({ ...prev, purpose, categories }));
      nextStep();
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Group Purpose</h2>
      <p className="text-slate-600 dark:text-slate-400 mt-1">Define the main objective and research areas for your group.</p>

      <div className="mt-8 space-y-6">
        <div>
          <label htmlFor="groupPurpose" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Purpose Of The Group</label>
          <input
            id="groupPurpose"
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="mt-1 block w-full input-style"
            placeholder="e.g., To accelerate the study of synaptic mapping."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select research areas</label>
          <div className="mt-2 p-3 border border-slate-200 dark:border-slate-700 rounded-md max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {researchCategories.map(cat => (
                <div key={cat} className="flex items-center">
                  <input
                    id={`cat-${cat}`}
                    type="checkbox"
                    checked={categories.includes(cat)}
                    onChange={() => handleCategoryToggle(cat)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor={`cat-${cat}`} className="ml-2 text-sm text-slate-700 dark:text-slate-300">{cat}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-between items-center">
        <button onClick={prevStep} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeftIcon className="w-4 h-4" />
          Back
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

export default OnboardingPurpose;