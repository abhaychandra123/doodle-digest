import React, { useState } from 'react';
import { useOnboardingState } from './OnboardingView';
import { GroupDraft } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface OnboardingStepProps {
  nextStep: () => void;
  prevStep: () => void;
}

const availableTools = ['Task Board', 'Shared Calendar', 'Lab Notebook', 'Dataset Repository', 'Literature Review Hub', 'Meeting Scheduler'];
const availableTemplates = ['Clinical Study', 'Computational Research', 'Social Science Survey'];

const OnboardingTools: React.FC<OnboardingStepProps> = ({ nextStep, prevStep }) => {
  const { groupDraft, setGroupDraft } = useOnboardingState();
  const [tools, setTools] = useState<string[]>(groupDraft.tools);
  const [template, setTemplate] = useState<GroupDraft['template']>(groupDraft.template);

  const handleToolToggle = (tool: string) => {
    setTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
  };

  const handleNext = () => {
    setGroupDraft(prev => ({ ...prev, tools, template }));
    nextStep();
  };
  
  const SelectableTile: React.FC<{ label: string; isSelected: boolean; onSelect: () => void; }> = ({ label, isSelected, onSelect }) => (
    <div onClick={onSelect} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}>
        <div className="flex items-center justify-between">
            <span className={`font-semibold ${isSelected ? 'text-indigo-800 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{label}</span>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isSelected ? 'bg-indigo-600' : 'border-2 border-slate-300 dark:border-slate-600'}`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
            </div>
        </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Select tools for your group</h2>
      <p className="text-slate-600 dark:text-slate-400 mt-1">Choose the tools and templates that best fit your research workflow.</p>
      
      <div className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tools</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableTools.map(tool => (
              <SelectableTile key={tool} label={tool} isSelected={tools.includes(tool)} onSelect={() => handleToolToggle(tool)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Templates (Optional)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableTemplates.map(t => (
              <SelectableTile key={t} label={t as string} isSelected={template === (t.toLowerCase().replace(/\s+/g, '-') as GroupDraft['template'])} onSelect={() => setTemplate(t.toLowerCase().replace(/\s+/g, '-') as GroupDraft['template'])} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-between items-center">
        <button onClick={prevStep} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <button onClick={handleNext} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500">
          Next: Review & Launch
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default OnboardingTools;