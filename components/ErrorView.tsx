import React from 'react';
import { WarningIcon } from './icons/WarningIcon';

interface ErrorViewProps {
  message: string;
  onReset: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ message, onReset }) => {
  return (
    <div className="w-full max-w-xl text-center bg-white dark:bg-[#1E1E1E] p-8 rounded-lg shadow-md border border-red-200 dark:border-red-500/30">
      <WarningIcon className="mx-auto h-12 w-12 text-red-500" />
      <h2 className="mt-4 text-2xl font-bold text-black dark:text-white">Oops, something went wrong.</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-md">
        {message}
      </p>
      <div className="mt-6">
        <button
          onClick={onReset}
          className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ErrorView;