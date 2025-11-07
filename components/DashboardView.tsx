import React, { useState } from 'react';
import { User, Document, Task, Activity, AppStats, ChartData } from '../types'; // --- NEW: Import AppStats, ChartData ---
import Sidebar from './Sidebar';
import ProgressChart from './ProgressChart';
import RecentActivities from './RecentActivities';
import DailyTasks from './DailyTasks';
import { PlusIcon } from './icons/PlusIcon';
import { MemoryIcon } from './icons/MemoryIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { PinIcon } from './icons/PinIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PencilIcon } from './icons/PencilIcon';
import { DoodleProtractorIcon } from './icons/decorations/DoodleProtractorIcon';
import { DoodleCompassIcon } from './icons/decorations/DoodleCompassIcon';
import { PencilAltIcon } from './icons/PencilAltIcon';
import { SpinnerIcon } from './icons/SpinnerIcon'; // --- NEW: Import SpinnerIcon ---

interface DashboardViewProps {
  user: User;
  documents: Document[];
  tasks: Task[];
  activities: Activity[];
  stats: AppStats | null; // --- NEW: Add stats prop (can be null) ---
  onStartNew: () => void;
  onViewDocument: (docId: string) => void;
  onNavigateToProfile: () => void;
  onNavigateToMemory: () => void;
  onNavigateToStoryfy: () => void;
  onNavigateToWritingWizard: () => void;
  onLogout: () => void;
  onAddTask: (text: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

// --- NEW: Empty state for charts while loading ---
const emptyChartData: ChartData[] = [];
const loadingDailyData: ChartData[] = [
  { label: 'S', value: 0 }, { label: 'M', value: 0 }, { label: 'T', value: 0 },
  { label: 'W', value: 0 }, { label: 'T', value: 0 }, { label: 'F', value: 0 }, { label: 'S', value: 0 }
];
const loadingWeeklyData: ChartData[] = [{ label: 'Week 0', value: 0 }];
const loadingMonthlyData: ChartData[] = [{ label: 'J', value: 0 }];


// --- DELETED: Mock data arrays (dailyData, weeklyData, monthlyData) are gone ---

const QuickAction: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void; }> = ({ icon, title, description, onClick }) => (
    <button
      onClick={onClick}
      className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left flex items-start gap-4 w-full border border-gray-200 dark:border-gray-700"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-black dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </button>
  );

// --- NEW: Chart loading component ---
const ChartLoader: React.FC = () => (
  <div className="p-4 rounded-xl shadow-sm h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800/50">
    <SpinnerIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
  </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  documents,
  tasks,
  activities, 
  stats, // --- NEW: Destructure stats ---
  onStartNew,
  onViewDocument,
  onNavigateToProfile,
  onNavigateToMemory,
  onNavigateToStoryfy,
  onNavigateToWritingWizard,
  onLogout,
  onAddTask,
  onToggleTask,
  onDeleteTask
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const [focusText, setFocusText] = useState('Review one note from last week to strengthen your memory recall!');
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [editedFocusText, setEditedFocusText] = useState(focusText);

  const handleFocusSave = () => {
    setFocusText(editedFocusText);
    setIsEditingFocus(false);
  };

  const handleFocusCancel = () => {
    setEditedFocusText(focusText);
    setIsEditingFocus(false);
  };

  return (
    <div className="w-full h-full flex bg-white dark:bg-[#121212]">
      <Sidebar
        user={user}
        documents={documents}
        onStartNew={onStartNew}
        onViewDocument={onViewDocument}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToMemory={onNavigateToMemory}
        onNavigateToStoryfy={onNavigateToStoryfy}
        onNavigateToWritingWizard={onNavigateToWritingWizard}
        onLogout={onLogout}
      />
      <main className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#121212] p-6 lg:p-8 relative">
        <DoodleProtractorIcon className="absolute -top-10 -right-10 w-48 h-48 text-gray-200/50 dark:text-gray-900/20 transform rotate-12 -z-0 pointer-events-none" />
        <DoodleCompassIcon className="absolute -bottom-12 -left-12 w-48 h-48 text-gray-200/50 dark:text-gray-900/20 transform -rotate-12 -z-0 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user.fullName}</span>!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {currentDate}
            </p>
          </div>
          
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickAction 
                  icon={<PlusIcon className="w-6 h-6" />}
                  title="New Summary"
                  description="Analyze a new paper or document."
                  onClick={onStartNew}
                />
                 <QuickAction 
                  icon={<PencilAltIcon className="w-6 h-6" />}
                  title="Writing Wizard"
                  description="Draft & refine papers with AI help."
                  onClick={onNavigateToWritingWizard}
                />
                <QuickAction 
                  icon={<MemoryIcon className="w-6 h-6" />}
                  title="Review Notes"
                  description="Visit your memory board of notes."
                  onClick={onNavigateToMemory}
                />
                <QuickAction 
                  icon={<BookOpenIcon className="w-6 h-6" />}
                  title="Create a Story"
                  description="Discover the creators behind a paper."
                  onClick={onNavigateToStoryfy}
                />
            </div>

            {/* Today's Focus & Tasks */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="relative bg-white dark:bg-transparent p-4 rounded-xl shadow-sm transform -rotate-1 border-2 border-dashed border-amber-500/50 dark:border-amber-300/30 xl:col-span-1 group">
                    <PinIcon className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 text-red-500 drop-shadow-sm" />
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <h3 className="font-doodle text-lg font-bold text-black dark:text-white">Focus of the Day</h3>
                        </div>
                        {!isEditingFocus && (
                            <button 
                                onClick={() => {
                                    setEditedFocusText(focusText);
                                    setIsEditingFocus(true);
                                }} 
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                                aria-label="Edit focus of the day"
                            >
                                <PencilIcon className="w-4 h-4 text-black/70 dark:text-white/70" />
                            </button>
                        )}
                    </div>

                    {isEditingFocus ? (
                        <div className="mt-2">
                            <textarea
                                value={editedFocusText}
                                onChange={(e) => setEditedFocusText(e.target.value)}
                                className="w-full font-doodle text-base bg-transparent border border-gray-500/50 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none text-black dark:text-white"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={handleFocusCancel} className="text-xs font-semibold text-black dark:text-white px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5">Cancel</button>
                                <button onClick={handleFocusSave} className="text-xs font-semibold px-3 py-1 bg-amber-400 text-amber-900 rounded-md hover:bg-amber-500">Save</button>
                            </div>
                        </div>
                    ) : (
                        <p className="font-doodle text-base text-black dark:text-white mt-2 min-h-[72px]">
                            {focusText}
                        </p>
                    )}
                </div>
                <div className="xl:col-span-2">
                    <DailyTasks 
                      tasks={tasks}
                      onAddTask={onAddTask}
                      onToggleTask={onToggleTask}
                      onDeleteTask={onDeleteTask}
                    />
                </div>
            </div>
            
            {/* Progress Section */}
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Progress Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- NEW: Use stats prop, with a loading fallback --- */}
                {stats ? (
                  <ProgressChart
                    title="Daily Progress"
                    subtitle="Tasks completed this week"
                    updated="just updated"
                    type="bar"
                    data={stats.daily}
                    color="#ef4444" // red-500
                    backgroundColor="#fecaca" // red-200
                    darkBackgroundColor="rgba(239, 68, 68, 0.15)"
                  />
                ) : <ChartLoader />}
                
                {stats ? (
                  <ProgressChart
                    title="Weekly Progress"
                    subtitle="Documents summarized"
                    updated="just updated"
                    type="line"
                    data={stats.weekly}
                    color="#22c55e" // green-500
                    backgroundColor="#bbf7d0" // green-200
                    darkBackgroundColor="rgba(34, 197, 94, 0.15)"
                  />
                ) : <ChartLoader />}

                {stats ? (
                  <ProgressChart
                    title="Monthly Progress"
                    subtitle="Documents summarized this year"
                    updated="just updated"
                    type="line"
                    data={stats.monthly}
                    color="#f59e0b" // amber-500
                    backgroundColor="#fde68a" // amber-200
                    darkBackgroundColor="rgba(245, 158, 11, 0.15)"
                  />
                ) : <ChartLoader />}
              </div>
            </div>

            {/* Recent Activities */}
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-4">Recent Activities</h2>
              <RecentActivities activities={activities} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardView;
