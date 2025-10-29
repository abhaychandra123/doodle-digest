import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { generateScribble } from '../services/geminiService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { PencilIcon } from './icons/PencilIcon';
import { Document } from '../types';

// CDN-loaded library, declare for TypeScript
declare const marked: any;

interface NotebookViewProps {
  document: Document;
  onReset: () => void;
  onBack: () => void;
}

interface PopoverState {
  top: number;
  left: number;
  text: string;
  range: Range;
  doodleState: 'idle' | 'loading' | 'loaded';
  doodleUrl: string | null;
}

const Doodle: React.FC<{ description: string }> = ({ description }) => {
    const [doodleUrl, setDoodleUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const generate = async () => {
            setIsLoading(true);
            const url = await generateScribble(description);
            if (isMounted) {
                setDoodleUrl(url);
                setIsLoading(false);
            }
        };
        generate();
        return () => { isMounted = false; };
    }, [description]);

    if (isLoading) {
        return (
            <span className="inline-block align-middle mx-2 my-4 w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <SpinnerIcon className="w-6 h-6 text-slate-400" />
            </span>
        );
    }

    if (!doodleUrl) {
        return null; // Don't render anything if doodle generation failed
    }

    return (
        <img
            src={doodleUrl}
            alt={description}
            className="inline-block align-middle mx-auto my-4 transform -rotate-2 drop-shadow-md dark:brightness-90"
            style={{ maxWidth: '180px', maxHeight: '180px' }}
        />
    );
};

const NotebookView: React.FC<NotebookViewProps> = ({ document, onReset, onBack }) => {
    const { notebookSummary, fileName } = document;
    
    const contentParts = useMemo(() => {
        // Regex to find [DOODLE: ...] and split the string
        const regex = /\[DOODLE: (.*?)\]/g;
        return notebookSummary.split(regex);
    }, [notebookSummary]);

    const contentRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const highlightNodeRef = useRef<HTMLSpanElement | null>(null);

    const [popover, setPopover] = useState<PopoverState | null>(null);

    const handleMouseUp = () => {
        if (!contentRef.current) return;
        
        const selection = window.getSelection();

        // Don't act if the selection is inside the popover
        if (selection && popoverRef.current?.contains(selection.anchorNode)) {
            return;
        }

        if (!selection || selection.isCollapsed) {
            if (popover) setPopover(null);
            return;
        }

        const selectionText = selection.toString().trim();
        if (selectionText.length > 5 && contentRef.current.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = contentRef.current.getBoundingClientRect();

            setPopover({
                top: rect.bottom - containerRect.top,
                left: rect.left - containerRect.left + rect.width / 2,
                text: selectionText,
                range,
                doodleState: 'idle',
                doodleUrl: null,
            });
        } else {
            setPopover(null);
        }
    };

    const handleGenerateDoodle = useCallback(async () => {
        if (!popover) return;
        setPopover(p => p ? { ...p, doodleState: 'loading' } : null);
        const url = await generateScribble(popover.text);
        setPopover(p => p ? { ...p, doodleState: 'loaded', doodleUrl: url } : null);
    }, [popover]);
    
    useEffect(() => {
        if (!popover) return;

        const range = popover.range.cloneRange();
        const span = window.document.createElement('span');
        span.className = "bg-amber-200/60 dark:bg-amber-400/30 rounded-sm";
        
        try {
            range.surroundContents(span);
            highlightNodeRef.current = span;
        } catch (e) {
            console.warn("Could not wrap content for highlighting.", e);
            setPopover(null);
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setPopover(null);
            }
        };
        
        window.document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.document.removeEventListener('mousedown', handleClickOutside);
            const nodeToClean = highlightNodeRef.current;
            if (nodeToClean && nodeToClean.parentNode) {
                const parent = nodeToClean.parentNode;
                while (nodeToClean.firstChild) {
                    parent.insertBefore(nodeToClean.firstChild, nodeToClean);
                }
                parent.removeChild(nodeToClean);
            }
            highlightNodeRef.current = null;
        };
    }, [popover]);


    const parsedHtml = (markdownText: string) => {
        if (typeof marked === 'undefined') {
            return markdownText;
        }
        return marked.parse(markdownText);
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-stretch">
            {/* Header Buttons */}
            <div className="flex-shrink-0 flex items-center justify-between mb-6 px-1">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-sm font-semibold rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Page View
                </button>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:block" title={fileName}>
                    Notes for: {fileName}
                </p>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500 transition-colors"
                >
                    <RefreshIcon className="w-4 h-4" />
                    Back to Dashboard
                </button>
            </div>

            {/* Notebook Paper */}
            <div className="bg-white shadow-xl rounded-lg p-6 sm:p-10 lg:p-12 relative overflow-hidden notebook-paper" onMouseUp={handleMouseUp}>
                <style>
                    {`
                        .notebook-paper {
                            background-color: #FEFDF9;
                            background-image: linear-gradient(to bottom, transparent 24px, #E0E0E0 25px);
                            background-size: 100% 25px;
                            padding-top: 40px; /* Space for top margin */
                        }
                        .dark .notebook-paper {
                            background-color: #1E293B; /* slate-800 */
                            background-image: linear-gradient(to bottom, transparent 24px, #334155 25px); /* slate-700 */
                        }
                        .notebook-paper::before {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 40px; /* Red line position */
                            width: 1px;
                            height: 100%;
                            background-color: #FFB6C1;
                        }
                         .dark .notebook-paper::before {
                            background-color: #818cf8; /* indigo-400 */
                         }
                        .notebook-content p, .notebook-content li {
                             line-height: 25px !important; /* Match background line height */
                        }
                    `}
                </style>
                <div ref={contentRef} className="notebook-content pl-12"> {/* Padding to be right of the red line */}
                    {contentParts.map((part, index) => {
                        if (index % 2 === 1) {
                            // This is a doodle description
                            return <Doodle key={index} description={part} />;
                        } else {
                            // This is a text part
                            return <div key={index} dangerouslySetInnerHTML={{ __html: parsedHtml(part) }} />;
                        }
                    })}
                </div>

                {popover && (
                    <div
                        ref={popoverRef}
                        className="absolute z-20 w-60 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 transition-opacity duration-200"
                        style={{ top: popover.top + 8, left: popover.left, transform: 'translateX(-50%)' }}
                        onMouseUp={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="relative">
                            {popover.doodleState === 'idle' && (
                                <button
                                    onClick={handleGenerateDoodle}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    Doodle this!
                                </button>
                            )}
                            {popover.doodleState === 'loading' && (
                                <div className="flex items-center justify-center p-4 h-24">
                                    <SpinnerIcon className="w-8 h-8 text-indigo-500" />
                                </div>
                            )}
                            {popover.doodleState === 'loaded' && (
                                <div className="flex flex-col items-center text-center p-2">
                                    {popover.doodleUrl ? (
                                        <img src={popover.doodleUrl} alt={`Doodle for: ${popover.text}`} className="max-w-full h-auto rounded-md border bg-slate-50 dark:bg-slate-700 p-1" />
                                    ) : (
                                        <p className="font-doodle text-sm text-red-600 dark:text-red-400 p-2">Could not create a doodle for this.</p>
                                    )}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 text-center italic truncate px-2" title={popover.text}>
                                "{popover.text}"
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotebookView;