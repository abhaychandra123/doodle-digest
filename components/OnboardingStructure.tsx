import React, { useState, useEffect } from 'react';
import { useOnboardingState } from './OnboardingView';
import { Privacy, Member } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { PlusIcon } from './icons/PlusIcon';

interface OnboardingStepProps {
  nextStep: () => void;
  prevStep: () => void;
}

const OnboardingStructure: React.FC<OnboardingStepProps> = ({ nextStep, prevStep }) => {
  const { groupDraft, setGroupDraft } = useOnboardingState();
  const [privacy, setPrivacy] = useState<Privacy>(groupDraft.privacy);
  const [members, setMembers] = useState<Member[]>(groupDraft.members);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Validation: at least one lead researcher
    setIsValid(members.some(m => m.role === 'Lead Researcher'));
  }, [members]);

  const handleRoleChange = (memberId: string, newRole: Member['role']) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
  };
  
  const handleNext = () => {
    if (isValid) {
      setGroupDraft(prev => ({ ...prev, privacy, members }));
      nextStep();
    }
  };

  const RolePermissionsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Roles & Permissions</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div><strong className="text-slate-900 dark:text-slate-100">Lead Researcher:</strong> Full admin rights. Can manage members, settings, and tools.</div>
            <div><strong className="text-slate-900 dark:text-slate-100">Contributor:</strong> Can create and edit content (tasks, notes). Cannot change group settings.</div>
            <div><strong className="text-slate-900 dark:text-slate-100">Reviewer:</strong> View-only access to content. Can leave comments where applicable.</div>
            <div><strong className="text-slate-900 dark:text-slate-100">Mentor:</strong> View-only access, can be assigned to guide contributors.</div>
        </div>
        <div className="mt-6 text-right">
            <button onClick={() => setShowRolesModal(false)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500">
                Got it
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 animate-fade-in">
      {showRolesModal && <RolePermissionsModal />}
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Group Structure and Roles</h2>
      <p className="text-slate-600 dark:text-slate-400 mt-1">Set your group's visibility and assign initial roles.</p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Privacy</label>
          <div className="flex gap-4">
            {(['Public', 'Private'] as Privacy[]).map(p => (
              <label key={p} className="flex items-center cursor-pointer">
                <input type="radio" name="privacy" value={p} checked={privacy === p} onChange={() => setPrivacy(p)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"/>
                <span className="ml-2 text-sm text-slate-800 dark:text-slate-200">{p}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {privacy === 'Public' ? 'Anyone can join or view this group.' : 'Only invited members can join or view this group.'}
          </p>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Members</label>
            <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-white dark:bg-slate-700/50 text-left text-slate-600 dark:text-slate-400">
                        <tr>
                            <th className="p-3 font-semibold">Member</th>
                            <th className="p-3 font-semibold">Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {members.map(member => (
                            <tr key={member.id}>
                                <td className="p-3 text-slate-800 dark:text-slate-200">{member.name}</td>
                                <td className="p-3">
                                    <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value as Member['role'])} className="w-full p-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-sm">
                                        <option>Lead Researcher</option>
                                        <option>Contributor</option>
                                        <option>Reviewer</option>
                                        <option>Mentor</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-2 flex justify-between items-center text-sm">
                 <button className="flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                    <PlusIcon className="w-4 h-4" /> Add Member
                 </button>
                 <button onClick={() => setShowRolesModal(true)} className="font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">
                    Edit Roles and Permissions
                 </button>
            </div>
        </div>
      </div>

      <div className="mt-10 flex justify-between items-center">
        <button onClick={prevStep} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <button onClick={handleNext} disabled={!isValid} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
          Next <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default OnboardingStructure;