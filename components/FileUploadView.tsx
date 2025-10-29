import React, { useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { CameraIcon } from './icons/CameraIcon';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import GoogleDrivePicker from './GoogleDrivePicker';

interface FileUploadViewProps {
  onFileUpload: (file: File) => void;
  onBack: () => void;
  onTakePhoto: () => void;
}

const InputOption: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  children?: React.ReactNode;
}> = ({ icon, title, description, onClick, children }) => (
  <div
    onClick={onClick}
    className="relative group bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer text-center flex flex-col items-center shadow-sm hover:shadow-lg"
  >
    <div className="mb-4">{icon}</div>
    <h3 className="font-bold text-black dark:text-white">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    {children}
  </div>
);

const FileUploadView: React.FC<FileUploadViewProps> = ({ onFileUpload, onBack, onTakePhoto }) => {
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl text-center">
       <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 group"
      >
        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </button>
      <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white sm:text-3xl">
        Add a New Document
      </h2>
      <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
        Choose a method to import your paper and let our AI do the rest.
      </p>
      
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <InputOption
          icon={<UploadIcon className="w-8 h-8 text-indigo-500" />}
          title="From Device"
          description="Upload a PDF from your computer."
          onClick={() => window.document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept=".pdf"
            className="sr-only"
            onChange={handleFileChange}
          />
        </InputOption>

        <InputOption
          icon={<CameraIcon className="w-8 h-8 text-teal-500" />}
          title="Take a Photo"
          description="Use your camera to snap a picture of a document."
          onClick={onTakePhoto}
        />

        <InputOption
          icon={<GoogleDriveIcon className="w-8 h-8 text-amber-500" />}
          title="From Google Drive"
          description="Connect and import a file from your Drive."
          onClick={() => setShowDrivePicker(true)}
        />
      </div>

      {showDrivePicker && <GoogleDrivePicker onClose={() => setShowDrivePicker(false)} />}
    </div>
  );
};

export default FileUploadView;