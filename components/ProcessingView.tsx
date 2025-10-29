
import React from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ProcessingViewProps {
  message: string;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <SpinnerIcon className="w-16 h-16 text-indigo-600" />
      <h2 className="mt-6 text-xl font-semibold text-black dark:text-white">
        Processing Your Paper...
      </h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

export default ProcessingView;