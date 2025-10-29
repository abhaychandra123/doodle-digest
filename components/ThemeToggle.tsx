import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-800 rounded-full">
      <button
        onClick={() => setTheme('light')}
        className={`px-4 py-1 text-sm font-semibold rounded-full transition-colors w-28 ${
          theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
        }`}
        aria-pressed={theme === 'light'}
      >
        Light Mode
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-4 py-1 text-sm font-semibold rounded-full transition-colors w-28 ${
          theme === 'dark' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
        }`}
        aria-pressed={theme === 'dark'}
      >
        Dark Mode
      </button>
    </div>
  );
};

export default ThemeToggle;