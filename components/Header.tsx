import React, { useState, useRef, useEffect } from 'react';
import { DoodleIcon } from './icons/DoodleIcon';
import { UserIcon } from './icons/UserIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { User } from '../types';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="w-full bg-white/80 dark:bg-[#121212]/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <DoodleIcon className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Doodle Digest
            </h1>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                  aria-label="User menu"
                >
                  <UserIcon className="w-5 h-5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E1E1E] rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 transition-all duration-200 ease-out origin-top-right transform opacity-100 scale-100">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                      <p className="text-sm font-medium text-black dark:text-white truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <LogoutIcon className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;