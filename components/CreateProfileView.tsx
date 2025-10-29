import React, { useState } from 'react';
import { DoodleBookStackIcon } from './icons/doodles/DoodleBookStackIcon';
import { DoodlePencilRulerIcon } from './icons/doodles/DoodlePencilRulerIcon';

interface CreateProfileViewProps {
  onProfileCreate: (name: string, status: string) => void;
}

const CreateProfileView: React.FC<CreateProfileViewProps> = ({ onProfileCreate }) => {
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState('');

  const canSubmit = fullName.trim().length > 2 && status.trim().length > 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onProfileCreate(fullName, status);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto p-4 flex items-center justify-center h-full">
       <DoodleBookStackIcon className="absolute -top-4 sm:-top-8 -left-12 sm:-left-24 w-32 h-32 sm:w-40 sm:h-40 text-orange-300 dark:text-orange-500/30 opacity-60 dark:opacity-50 transform -rotate-12 pointer-events-none" />
       <DoodlePencilRulerIcon className="absolute -bottom-4 sm:-bottom-8 -right-12 sm:-right-24 w-32 h-32 sm:w-40 sm:h-40 text-blue-300 dark:text-blue-500/30 opacity-60 dark:opacity-50 transform rotate-12 pointer-events-none" />
      
      <div className="relative bg-white/50 dark:bg-[#1E1E1E]/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-2xl shadow-lg p-8 text-center w-full">
        <h1 className="text-3xl font-bold font-doodle text-slate-800 dark:text-slate-200">Welcome!</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Let's set up your student profile.</p>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 text-left">
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Your Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full input-style"
              placeholder="e.g., Jane Doe"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              What are you learning?
            </label>
            <input
              id="status"
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full input-style"
              placeholder="e.g., Learning Python!"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full px-5 py-3 bg-indigo-600 text-white text-base font-semibold rounded-lg shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Create My Profile
          </button>
        </form>
      </div>
      <style>{`.input-style {
        color: #1f2937; /* gray-800 */
        background-color: #f9fafb; /* gray-50 */
        border: 1px solid #cbd5e1; /* slate-300 */
        border-radius: 0.5rem; /* rounded-lg */
        padding: 0.6rem 0.8rem;
        width: 100%;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .dark .input-style {
        color: #f3f4f6; /* gray-100 */
        background-color: #374151; /* gray-700 */
        border-color: #4b5563; /* gray-600 */
      }
      .input-style:focus {
        outline: none;
        border-color: #6366f1; /* indigo-500 */
        box-shadow: 0 0 0 2px rgb(165 180 252 / 40%); /* indigo-200 with opacity */
      }
      .dark .input-style:focus {
        border-color: #818cf8; /* indigo-400 */
        box-shadow: 0 0 0 2px rgb(129 140 248 / 40%); /* indigo-400 with opacity */
      }`}</style>
    </div>
  );
};

export default CreateProfileView;