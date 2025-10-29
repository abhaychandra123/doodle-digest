import React from 'react';

interface StatCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, score, icon, color }) => {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{score.toLocaleString(undefined, { minimumFractionDigits: score % 1 !== 0 ? 1 : 0 })}</p>
      </div>
    </div>
  );
};

export default StatCard;