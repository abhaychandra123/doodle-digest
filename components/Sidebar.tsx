import React from 'react';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { PlusIcon } from './icons/PlusIcon';
import { Document, User } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { MemoryIcon } from './icons/MemoryIcon';
import { GoogleDocsIcon } from './icons/GoogleDocsIcon';
import { GoogleSheetsIcon } from './icons/GoogleSheetsIcon';
import { HomeIcon } from './icons/HomeIcon';
import { SlackIcon } from './icons/SlackIcon';
import { ZoomIcon } from './icons/ZoomIcon';
import { TeamsIcon } from './icons/TeamsIcon';
import { PencilAltIcon } from './icons/PencilAltIcon';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; isCollapsed: boolean; href?: string; target?: string; }> = ({ icon, label, active, onClick, isCollapsed, href, target }) => (
  <li>
    <a
      href={href || "#"}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      onClick={(e) => {
        if (!href) e.preventDefault();
        onClick?.();
      }}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-gray-200 dark:bg-gray-800 text-black dark:text-white' : 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      {icon}
      <span className={`truncate transition-opacity ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>{label}</span>
    </a>
  </li>
);

interface SidebarProps {
  user: User;
  documents: Document[];
  onStartNew: () => void;
  onViewDocument: (docId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateToProfile: () => void;
  onNavigateToMemory: () => void;
  onNavigateToStoryfy: () => void;
  onNavigateToWritingWizard: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, documents, onStartNew, onViewDocument, isCollapsed, onToggleCollapse, onNavigateToProfile, onNavigateToMemory, onNavigateToStoryfy, onNavigateToWritingWizard, onLogout }) => {
  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 bg-white dark:bg-[#1E1E1E] border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between relative h-[65px]">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.17l-3.59-3.59L9 11l2 2 4-4 1.59 1.59L11 16.17z" /></svg>
          </div>
          <span className={`font-bold text-lg text-black dark:text-white whitespace-nowrap transition-opacity ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Doodle Digest</span>
        </div>
        <button onClick={onToggleCollapse} className="text-gray-500 hover:text-black dark:hover:text-white absolute right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-[#1E1E1E] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-1">
            <ChevronLeftIcon className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          <NavItem icon={<HomeIcon className="w-5 h-5" />} label="Dashboard" active={true} isCollapsed={isCollapsed} />
          <NavItem icon={<PencilAltIcon className="w-5 h-5" />} label="Writing Wizard" onClick={onNavigateToWritingWizard} isCollapsed={isCollapsed} />
          <NavItem icon={<UserCircleIcon className="w-5 h-5" />} label="Profile" onClick={onNavigateToProfile} isCollapsed={isCollapsed} />
          <NavItem icon={<MemoryIcon className="w-5 h-5" />} label="Memory" onClick={onNavigateToMemory} isCollapsed={isCollapsed} />
          <NavItem icon={<BookOpenIcon className="w-5 h-5" />} label="Storyfy" onClick={onNavigateToStoryfy} isCollapsed={isCollapsed} />
          <div className="h-px my-3 bg-gray-200 dark:bg-gray-700"></div>
          {user.integrations?.slack && <NavItem icon={<SlackIcon className="w-5 h-5" />} label="Slack" isCollapsed={isCollapsed} href="https://slack.com" target="_blank" />}
          {user.integrations?.zoom && <NavItem icon={<ZoomIcon className="w-5 h-5" />} label="Zoom" isCollapsed={isCollapsed} href="https://zoom.us" target="_blank" />}
          {user.integrations?.teams && <NavItem icon={<TeamsIcon className="w-5 h-5" />} label="MS Teams" isCollapsed={isCollapsed} href="https://teams.microsoft.com" target="_blank" />}
          <NavItem icon={<GoogleDocsIcon className="w-5 h-5" />} label="Google Docs" isCollapsed={isCollapsed} href="https://docs.google.com" target="_blank" />
          <NavItem icon={<GoogleSheetsIcon className="w-5 h-5" />} label="Google Sheets" isCollapsed={isCollapsed} href="https://sheets.google.com" target="_blank" />
          <div className="h-px my-3 bg-gray-200 dark:bg-gray-700"></div>
          <NavItem icon={<SparklesIcon className="w-5 h-5" />} label="Doodle Digest Pro" isCollapsed={isCollapsed} />
        </ul>

        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className={`px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-all ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? 'Docs' : 'Summaries'}
          </h3>
          <ul className="mt-2 space-y-1">
            <li className="my-2">
                <button
                    onClick={onStartNew}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 dark:hover:bg-indigo-500 transition-colors"
                    title={isCollapsed ? 'New Summary' : undefined}
                >
                    <PlusIcon className="w-5 h-5" />
                    {!isCollapsed && <span className="truncate">New Summary</span>}
                </button>
            </li>
            {documents.map((doc) => (
              <NavItem
                key={doc.id}
                icon={<DocumentIcon className="w-5 h-5" />}
                label={doc.fileName}
                onClick={() => onViewDocument(doc.id)}
                isCollapsed={isCollapsed}
              />
            ))}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            {user.profilePictureUrl ? (
              <img className="w-full h-full object-cover" src={user.profilePictureUrl} alt={user.fullName || user.username} />
            ) : (
              <span className="font-bold text-gray-500">{(user.fullName || user.username || user.email).charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
            <p className="text-sm font-semibold text-black dark:text-white truncate">{user.fullName || user.username}</p>
             <button onClick={onLogout} className="group flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
              <LogoutIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;