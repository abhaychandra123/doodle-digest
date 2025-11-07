import React, { useState } from 'react';
import { Task } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { TrashIcon } from './icons/TrashIcon'; // Import the TrashIcon

interface DailyTasksProps {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const DailyTasks: React.FC<DailyTasksProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim()); // Call the prop function
      setNewTaskText('');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl shadow-sm h-full flex flex-col border border-gray-200 dark:border-gray-700">
      <h3 className="font-bold text-black dark:text-white">Today's Tasks</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Stay on top of your daily goals.</p>
      
      <div className="mt-4 flex-grow overflow-y-auto pr-2">
        {tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.map(task => {
              // Use the backend's _id if present, otherwise fall back to id
              const taskId = (task as any)._id || task.id;
              return (
                <li key={taskId} className="flex items-center group">
                  <input
                    id={`task-checkbox-${taskId}`}
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(taskId)}
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`task-checkbox-${taskId}`}
                    className={`ml-3 text-sm font-medium text-black dark:text-white flex-grow ${
                      task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''
                    }`}
                  >
                    {task.text}
                  </label>
                  <button
                    onClick={() => onDeleteTask(taskId)}
                    className="ml-2 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete task"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-6">
            <ClipboardListIcon className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">No tasks for today. Add one!</p>
          </div>
        )}
      </div>

      <form onSubmit={handleAddTask} className="mt-4 flex-shrink-0 flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-[#121212] dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
        />
        <button
          type="submit"
          className="p-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default DailyTasks;