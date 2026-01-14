import React from 'react';
import { useOnboardingState } from './OnboardingView';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { GroupDraft } from '../types';

interface OnboardingStepProps {
  onComplete: (groupDraft: GroupDraft) => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}
const OnboardingReview: React.FC<OnboardingStepProps> = ({ onComplete, prevStep, goToStep }) => {
  const { groupDraft } = useOnboardingState();
  
  const SummaryItem: React.FC<{ label: string; children: React.ReactNode; editStep: number }> = ({ label, children, editStep }) => (
    <div className="flex justify-between items-start py-3">
      <div>
        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{children}</dd>
      </div>
      <button onClick={() => goToStep(editStep)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Edit</button>
    </div>
  );

  const memberSummary = () => {
      const roles = groupDraft.members.reduce((acc, member) => {
          acc[member.role] = (acc[member.role] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      return `${groupDraft.members.length} (${Object.entries(roles).map(([role, count]) => `${count} ${role}`).join(', ')})`;
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Review & Launch</h2>
      <p className="text-slate-600 dark:text-slate-400 mt-1">Confirm your group details. You can always change these later.</p>

      <div className="mt-6 border-t border-b border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
        <SummaryItem label="Group Name & Description" editStep={1}>
            <span className="font-semibold">{groupDraft.name}</span><br/>{groupDraft.description}
        </SummaryItem>
        <SummaryItem label="Purpose & Categories" editStep={1}>
            {groupDraft.purpose}<br/><span className="text-xs text-slate-500 dark:text-slate-400">{groupDraft.categories.join(', ')}</span>
        </SummaryItem>
        <SummaryItem label="Privacy" editStep={3}>{groupDraft.privacy}</SummaryItem>
        <SummaryItem label="Members" editStep={3}>{memberSummary()}</SummaryItem>
        <SummaryItem label="Tools" editStep={4}>
            {groupDraft.tools.length > 0 ? groupDraft.tools.join(', ') : 'No tools selected'}
        </SummaryItem>
      </div>

      <div className="mt-10 flex justify-between items-center">
        <button onClick={prevStep} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <button onClick={() => onComplete(groupDraft)} className="px-6 py-3 bg-indigo-600 text-white text-base font-semibold rounded-md shadow-sm hover:bg-indigo-500">
          Launch Group
        </button>
      </div>
       <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default OnboardingReview;
