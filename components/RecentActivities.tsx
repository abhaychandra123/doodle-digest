import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { Activity } from '../types'; // --- NEW: Import Activity type ---
import { PencilAltIcon } from './icons/PencilAltIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { UsersGroupIcon } from './icons/UsersGroupIcon';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon'; // Using this as a fallback

// --- NEW: Helper to get an icon based on the activity type ---
const GetActivityIcon: React.FC<{ icon: string }> = ({ icon }) => {
  const className = "w-5 h-5";
  switch (icon) {
    case 'summarizer':
      return <DocumentTextIcon className={className} />;
    case 'task':
      return <ClipboardListIcon className={className} />;
    case 'writing':
      return <PencilAltIcon className={className} />;
    case 'group':
      return <UsersGroupIcon className={className} />;
    case 'profile':
      return <UserIcon className={className} />;
    default:
      return <SparklesIcon className={className} />;
  }
};

// --- NEW: Helper to format time strings ---
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface RecentActivitiesProps {
  activities: Activity[]; // --- NEW: Expect activities as a prop ---
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  const completedTasksThisMonth = 4; // This would also come from an API

  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm h-full border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="font-bold text-black dark:text-white">Recent Activities</h3>
            <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" /> {completedTasksThisMonth} done this month
            </p>
        </div>
        <button className="text-gray-400 hover:text-black dark:hover:text-white">
            <MoreVerticalIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                <tr>
                    <th className="py-2 px-2">Activities</th>
                    <th className="py-2 px-2">Time</th>
                </tr>
            </thead>
            <tbody>
                {activities.length > 0 ? (
                  activities.map((activity) => (
                      <tr key={activity._id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                          <td className="py-3 px-2 font-medium text-black dark:text-white flex items-center gap-3">
                              <span className="text-gray-500 dark:text-gray-400">
                                <GetActivityIcon icon={activity.icon} />
                              </span> 
                              {activity.text}
                          </td>
                          <td className="py-3 px-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatTimeAgo(activity.createdAt)}
                          </td>
                      </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-gray-500 dark:text-gray-400">
                      No recent activities. Get started by summarizing a document!
                    </td>
                  </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentActivities;