import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';

const activities = [
  { icon: '🤖', name: 'Communication', time: 'November 09, 2024 11:56 PM', completion: 100 },
  // Add more mock activities if needed
];

const RecentActivities: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h3 className="font-bold text-black dark:text-white">Recent Activities</h3>
            <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" /> 26 done this month
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
                    <th className="py-2 px-2 text-right">Completion</th>
                </tr>
            </thead>
            <tbody>
                {activities.map((activity, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <td className="py-3 px-2 font-medium text-black dark:text-white flex items-center gap-2">
                            <span className="text-xl">{activity.icon}</span> {activity.name}
                        </td>
                        <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{activity.time}</td>
                        <td className="py-3 px-2 text-right text-gray-500 dark:text-gray-400">{activity.completion}%</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentActivities;