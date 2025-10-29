import React, { useMemo } from 'react';
import { Document } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { PinIcon } from './icons/PinIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { DoodleMathPaperIcon } from './icons/doodles/DoodleMathPaperIcon';
import { DoodleNotebookIcon } from './icons/doodles/DoodleNotebookIcon';
import { DoodlePencilRulerIcon } from './icons/doodles/DoodlePencilRulerIcon';
import { EmptyNotesIcon } from './icons/EmptyNotesIcon';

interface MemoryViewProps {
  documents: Document[];
  onOpenNote: (docId: string, options: { pageNumber: number }) => void;
  onBack: () => void;
}

const decorativeIcons = [DoodleMathPaperIcon, DoodleNotebookIcon, DoodlePencilRulerIcon];

const NoteCard: React.FC<{
  note: any;
  onOpen: () => void;
}> = ({ note, onOpen }) => {
  
  const title = useMemo(() => {
    const firstLine = note.content.split('\n')[0];
    return firstLine.replace(/^[#\s]*/, '').trim() || 'Untitled Note';
  }, [note.content]);

  const cardColor = useMemo(() => {
    const colors = [
      'border-yellow-500/30',
      'border-blue-500/30',
      'border-green-500/30',
      'border-pink-500/30',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const rotation = useMemo(() => `rotate(${Math.random() * 4 - 2}deg)`, []);

  const DecorativeIcon = useMemo(() => decorativeIcons[Math.floor(Math.random() * decorativeIcons.length)], []);

  return (
    <div 
      className={`relative p-4 border rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ease-in-out hover:-translate-y-1 bg-white dark:bg-[#1E1E1E] ${cardColor}`}
      style={{ transform: rotation }}
    >
      <PinIcon className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 text-red-500 drop-shadow-sm" />
      <DecorativeIcon className="absolute top-2 right-2 w-8 h-8 text-gray-400/30 dark:text-gray-500/30" />
      
      <div className="flex flex-col h-full">
        <h3 className="font-doodle text-xl font-bold text-black dark:text-white mb-2 mt-4 truncate">{title}</h3>
        
        <div className="flex-grow space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <DocumentIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate" title={note.docFileName}>{note.docFileName}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
                Created on {new Date(note.createdAt).toLocaleDateString()}
            </p>
        </div>
        
        <div className="mt-4 pt-3 border-t border-dashed border-gray-400/50 flex items-center justify-between gap-2">
          <button 
            onClick={onOpen}
            className="font-doodle text-base px-3 py-1 bg-white/70 dark:bg-gray-800/50 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 text-black dark:text-white"
          >
            Open Note
          </button>
           <button 
            disabled
            className="flex items-center gap-1.5 font-doodle text-base px-3 py-1 rounded-md border border-gray-300/80 dark:border-gray-600/80 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
          >
            <PaperclipIcon className="w-4 h-4" /> Attach File
          </button>
        </div>
      </div>
    </div>
  );
};

const MemoryView: React.FC<MemoryViewProps> = ({ documents, onOpenNote, onBack }) => {
  const allNotes = useMemo(() => {
    return documents
      .flatMap(doc => 
        doc.userNotes.map(note => ({
          ...note,
          docFileName: doc.fileName,
          docId: doc.id,
        }))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [documents]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-doodle text-black dark:text-white">Memory Board</h1>
            <p className="text-gray-500 dark:text-gray-400">All your notes and thoughts, in one place.</p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white group px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600"
        >
          <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>
      </div>

      {allNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onOpen={() => onOpenNote(note.docId, { pageNumber: note.pageNumber })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white/10 dark:bg-black/20">
            <EmptyNotesIcon className="mx-auto w-20 h-20" />
            <h2 className="mt-4 text-xl font-bold text-black dark:text-white">Your Memory Board is Empty</h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Add notes to your documents and they will all appear here!</p>
        </div>
      )}
    </div>
  );
};

export default MemoryView;