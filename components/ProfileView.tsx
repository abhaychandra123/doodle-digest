import React, { useState, useEffect } from 'react';
import { User, Badge, Skill } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SlackIcon } from './icons/SlackIcon';
import { ZoomIcon } from './icons/ZoomIcon';
import { TeamsIcon } from './icons/TeamsIcon';

import { BadgeLearnerIcon } from './icons/BadgeLearnerIcon';
import { BadgeSummarizerIcon } from './icons/BadgeSummarizerIcon';
import { BadgeStreakIcon } from './icons/BadgeStreakIcon';


interface ProfileViewProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  onBack: () => void;
}

const badgeIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  'BadgeLearner': BadgeLearnerIcon,
  'BadgeSummarizer': BadgeSummarizerIcon,
  'BadgeStreak': BadgeStreakIcon,
};

const SkillBar: React.FC<{ skill: Skill }> = ({ skill }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-doodle text-lg text-black dark:text-white">{skill.name}</span>
        <span className="font-doodle text-sm font-semibold text-gray-500 dark:text-gray-400">{skill.level}%</span>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 p-0.5">
        <div 
          className="h-full bg-blue-400 dark:bg-blue-500 rounded-sm transition-all duration-500" 
          style={{ width: `${skill.level}%`, 
                   backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)` 
          }}
        ></div>
      </div>
    </div>
  );
};

const BadgeItem: React.FC<{ badge: Badge }> = ({ badge }) => {
    const IconComponent = badgeIcons[badge.icon];
    return (
        <div className="group relative flex flex-col items-center text-center p-2" title={badge.description}>
            <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                {IconComponent ? <IconComponent className="w-8 h-8 text-gray-600 dark:text-gray-300" /> : null}
            </div>
            <p className="mt-2 font-doodle text-base text-gray-500 dark:text-gray-400">{badge.name}</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {badge.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black"></div>
            </div>
        </div>
    );
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; }> = ({ checked, onChange }) => (
    <button
        type="button"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-white ${checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);


const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateProfile, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.fullName || '');
  const [editedStatus, setEditedStatus] = useState(user.status || '');

  const handleSave = () => {
    onUpdateProfile({ ...user, fullName: editedName.trim(), status: editedStatus });
    setIsEditing(false);
  };

  const handleIntegrationChange = (integration: 'slack' | 'zoom' | 'teams') => {
    const newIntegrations = {
      ...user.integrations,
      slack: user.integrations?.slack || false,
      zoom: user.integrations?.zoom || false,
      teams: user.integrations?.teams || false,
      [integration]: !user.integrations?.[integration],
    };
    onUpdateProfile({ ...user, integrations: newIntegrations });
  };


  useEffect(() => {
    setEditedName(user.fullName || '');
    setEditedStatus(user.status || '');
  }, [user]);

  const IntegrationRow: React.FC<{ icon: React.ReactNode, name: string, isEnabled: boolean, onToggle: () => void }> = ({ icon, name, isEnabled, onToggle }) => (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
            {icon}
            <span className="font-semibold text-black dark:text-white">{name}</span>
        </div>
        <ToggleSwitch checked={isEnabled} onChange={onToggle} />
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-4">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white group"
            >
                <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
            </button>
        </div>
        <div className="hand-drawn-border-summary bg-white dark:bg-[#121212] p-6 space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative flex-shrink-0">
                    <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-[#121212] shadow-lg">
                        {user.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-5xl font-bold text-gray-400 dark:text-gray-500">{(user.fullName || user.username || '').charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </div>
                <div className="flex-grow text-center sm:text-left">
                    {isEditing ? (
                         <input 
                            type="text" 
                            value={editedName} 
                            onChange={(e) => setEditedName(e.target.value)} 
                            className="font-doodle text-3xl font-bold text-black dark:text-white bg-gray-200/50 dark:bg-gray-700/50 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                            autoFocus
                        />
                    ) : (
                        <h1 className="font-doodle text-4xl font-bold text-black dark:text-white">{user.fullName}</h1>
                    )}
                    <p className="text-indigo-500 dark:text-indigo-400 font-semibold">{user.role}</p>

                     {isEditing ? (
                      <textarea
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value)}
                        placeholder="What are you learning?"
                        className="mt-2 w-full text-sm text-black dark:text-white bg-white dark:bg-[#1E1E1E] rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                      />
                    ) : (
                      <p className="mt-2 text-gray-500 dark:text-gray-400">{user.status}</p>
                    )}
                </div>
                <div className="flex-shrink-0 mt-2 sm:mt-0">
                     <button 
                        onClick={isEditing ? handleSave : () => setIsEditing(true)}
                        className={`font-doodle text-lg border-2 rounded-lg px-4 py-1 transition-all duration-200 flex items-center gap-2 transform hover:scale-105 ${
                            isEditing 
                                ? 'border-green-500 text-green-600 dark:border-green-400 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10' 
                                : 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                        }`}
                     >
                        {isEditing ? <CheckCircleIcon className="w-5 h-5" /> : <PencilIcon className="w-4 h-4" />}
                        {isEditing ? 'Save' : 'Edit Profile'}
                    </button>
                </div>
            </div>

             {/* Connected Apps Section */}
            <div>
                <h3 className="font-doodle text-2xl font-bold text-black dark:text-white mb-4">Connected Apps</h3>
                <div className="space-y-3">
                    <IntegrationRow icon={<SlackIcon className="w-6 h-6" />} name="Slack" isEnabled={user.integrations?.slack || false} onToggle={() => handleIntegrationChange('slack')} />
                    <IntegrationRow icon={<ZoomIcon className="w-6 h-6" />} name="Zoom" isEnabled={user.integrations?.zoom || false} onToggle={() => handleIntegrationChange('zoom')} />
                    <IntegrationRow icon={<TeamsIcon className="w-6 h-6" />} name="Microsoft Teams" isEnabled={user.integrations?.teams || false} onToggle={() => handleIntegrationChange('teams')} />
                </div>
            </div>

            {/* Badges Section */}
            <div>
                <h3 className="font-doodle text-2xl font-bold text-black dark:text-white mb-2">My Badges</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {user.badges && user.badges.length > 0 ? (
                        user.badges.map(badge => <BadgeItem key={badge.id} badge={badge} />)
                    ) : (
                        <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-4">No badges earned yet. Keep learning!</p>
                    )}
                </div>
            </div>

            {/* Skills Section */}
            <div>
                <h3 className="font-doodle text-2xl font-bold text-black dark:text-white mb-4">Skill Summary</h3>
                <div className="space-y-4">
                     {user.skills && user.skills.length > 0 ? (
                        user.skills.map(skill => <SkillBar key={skill.name} skill={skill} />)
                     ) : (
                         <p className="text-center text-gray-500 dark:text-gray-400 py-4">No skills tracked yet. Start summarizing to see your progress!</p>
                     )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProfileView;