import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserNote } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import Draggable from './Draggable';
import { sanitizeHtml } from '../utils/sanitizeHtml';

declare const marked: any;

interface UserNoteItemProps {
    note: UserNote;
    parentRef: React.RefObject<HTMLDivElement>;
    onUpdate: (note: UserNote) => void;
    onDelete: (noteId: string) => void;
}

const UserNoteItem: React.FC<UserNoteItemProps> = ({ note, parentRef, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(note.content);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setContent(note.content);
    }, [note.content]);

    useEffect(() => {
        if (isEditing && textAreaRef.current) {
            textAreaRef.current.focus();
            textAreaRef.current.select();
        }
    }, [isEditing]);
    
    const handleLayoutChange = (newStyle: React.CSSProperties) => {
        onUpdate({ ...note, style: newStyle });
    };

    const handleContentBlur = () => {
        setIsEditing(false);
        if (content.trim() !== note.content.trim()) {
            onUpdate({ ...note, content: content });
        }
    };

    const parsedContent = useMemo(() => {
        if (typeof marked === 'undefined') return sanitizeHtml(note.content);
        return sanitizeHtml(marked.parse(note.content));
    }, [note.content]);

    return (
        <Draggable
            style={note.style}
            parentRef={parentRef}
            onLayoutChange={handleLayoutChange}
            onDoubleClick={() => setIsEditing(true)}
            isResizable={true}
            isEditingDisabled={isEditing}
        >
            <div className="relative w-full h-full p-4 bg-amber-200 dark:bg-amber-400/80 shadow-lg rounded-md notebook-content overflow-hidden">
                {isEditing ? (
                    <textarea
                        ref={textAreaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleContentBlur}
                        className="w-full h-full p-0 m-0 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 font-doodle text-lg text-black"
                        style={{ lineHeight: 1.5 }}
                    />
                ) : (
                    <div
                        className="prose prose-sm font-doodle text-black"
                        dangerouslySetInnerHTML={{ __html: parsedContent }}
                    />
                )}

                <button 
                    onClick={() => onDelete(note.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/10 rounded-full flex items-center justify-center text-slate-700 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete note"
                >
                    <TrashIcon className="w-3 h-3" />
                </button>
            </div>
        </Draggable>
    );
};

export default UserNoteItem;
