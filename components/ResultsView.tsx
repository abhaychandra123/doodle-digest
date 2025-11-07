import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Document, PdfPage, ChunkSummary, UserNote } from '../types';
import { DoodleIcon } from './icons/DoodleIcon';
import { NotebookIcon } from './icons/NotebookIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { AddNoteIcon } from './icons/AddNoteIcon';
import UserNoteItem from './UserNoteItem';
import ShareModal from './ShareModal';
import Draggable from './Draggable';

// CDN-loaded library, declare for TypeScript
declare const marked: any;
declare const html2canvas: any;
declare const jspdf: any;
declare const pdfjsLib: any;

interface ResultsViewProps {
  document: Document;
  onUpdateDocument: (updatedDoc: Document) => void;
  onReset: () => void;
  onShowNotebook: () => void;
  scrollTarget: { docId: string; pageNumber: number } | null;
  onClearScrollTarget: () => void;
}

const FormattedSummary: React.FC<{ text: string }> = ({ text }) => {
    // Split by **bold** and *italic* using a regex that captures the delimiters
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);

    return (
        <p className="font-doodle text-base leading-relaxed summary-text-color">
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <span key={index} className="handwritten-underline">{part.slice(2, -2)}</span>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <span key={index} className="handwritten-highlight">{part.slice(1, -1)}</span>;
                }
                return <span key={index}>{part}</span>;
            })}
        </p>
    );
};

const SummaryNote: React.FC<{ summaryText: string }> = ({ summaryText }) => {
    return (
        <div
            className="p-3 shadow-lg w-full h-full paper-texture transition-shadow duration-200 ease-in-out group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center hand-drawn-border-summary"
        >
            <FormattedSummary text={summaryText} />
        </div>
    );
};

const DraggablePage: React.FC<{
    page: PdfPage;
    chunkSummaries: ChunkSummary[];
    userNotes: UserNote[];
    onNoteAdd: (pageNumber: number) => void;
    onNoteUpdate: (note: UserNote) => void;
    onNoteDelete: (noteId: string) => void;
    onLayoutChange: (itemType: 'summary' | 'doodle', pageNumber: number, summaryIndex: number, newStyle: React.CSSProperties) => void;
    layouts: { [key: string]: React.CSSProperties };
    pageCount: number;
    onDoodleDoubleClick: (url: string) => void;
    pdfDataUrl?: string;
}> = ({ page, chunkSummaries, userNotes, onNoteAdd, onNoteUpdate, onNoteDelete, onLayoutChange, layouts, pageCount, onDoodleDoubleClick, pdfDataUrl }) => {
    const pageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Client-side PDF render fallback when imageUrl missing
    useEffect(() => {
      if (!pdfDataUrl || page.imageUrl) return; // no need if we already have an image
      if (!canvasRef.current || !pageRef.current || typeof pdfjsLib === 'undefined') return;
      let cancelled = false;
      (async () => {
        try {
          const pdf = await pdfjsLib.getDocument({ url: pdfDataUrl }).promise;
          const pdfPage = await pdf.getPage(page.pageNumber);
          const container = pageRef.current!;
          const c = canvasRef.current!;
          const rect = container.getBoundingClientRect();
          // Render with scale that fits the container width
          const viewport = pdfPage.getViewport({ scale: 1 });
          const scale = Math.min(rect.width / viewport.width, rect.height / viewport.height);
          const vp = pdfPage.getViewport({ scale: scale || 1 });
          c.width = Math.ceil(vp.width);
          c.height = Math.ceil(vp.height);
          const ctx = c.getContext('2d');
          await pdfPage.render({ canvasContext: ctx, viewport: vp }).promise;
        } catch (e) {
          // ignore render errors; page will remain white
          console.warn('PDF render fallback failed:', e);
        }
      })();
      return () => { cancelled = true; };
    }, [pdfDataUrl, page.imageUrl, page.pageNumber]);

    return (
        <div id={`page-${page.pageNumber}`} ref={pageRef} className="relative shadow-lg rounded-lg overflow-hidden bg-white aspect-[8.5/11] pdf-page-container">
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`PDF page ${page.pageNumber}`}
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            ) : (
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            )}
            
            <div className="absolute inset-0 z-10">
                {chunkSummaries.map((summary, index) => (
                  <React.Fragment key={`summary-group-${page.pageNumber}-${index}`}>
                    <Draggable
                        style={layouts[`summary-${page.pageNumber}-${index}`]}
                        parentRef={pageRef}
                        onLayoutChange={(newStyle) => onLayoutChange('summary', page.pageNumber, index, newStyle)}
                    >
                        <SummaryNote summaryText={summary.summary} />
                    </Draggable>

                    {summary.doodleUrl && (
                        <Draggable
                            style={layouts[`doodle-${page.pageNumber}-${index}`]}
                            parentRef={pageRef}
                            isResizable={true}
                            onLayoutChange={(newStyle) => onLayoutChange('doodle', page.pageNumber, index, newStyle)}
                            onDoubleClick={() => onDoodleDoubleClick(summary.doodleUrl!)}
                        >
                            <div className="w-full h-full hand-drawn-border-doodle flex items-center justify-center">
                                <img
                                    draggable="false"
                                    src={summary.doodleUrl}
                                    alt="Doodle for a section"
                                    className="drop-shadow-md w-full h-full object-contain transition-all duration-200 ease-in-out group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.7)] dark:brightness-90"
                                    style={{ imageRendering: 'crisp-edges' }}
                                />
                            </div>
                        </Draggable>
                    )}
                  </React.Fragment>
                ))}
                
                {userNotes.map(note => (
                    <UserNoteItem
                        key={note.id}
                        note={note}
                        parentRef={pageRef}
                        onUpdate={onNoteUpdate}
                        onDelete={onNoteDelete}
                    />
                ))}
            </div>

            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <button 
                onClick={() => onNoteAdd(page.pageNumber)}
                className="w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-md hover:bg-amber-200 dark:hover:bg-amber-400 text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-900 transition-all flex items-center justify-center group"
                title="Add a sticky note"
              >
                  <AddNoteIcon className="w-5 h-5 transition-transform group-hover:rotate-12"/>
              </button>
            </div>

            <div className="absolute bottom-2 right-3 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-900/70 px-2 py-1 rounded">
                Page {page.pageNumber} of {pageCount}
            </div>
        </div>
    );
};

const TotalSummaryPage: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = useMemo(() => {
        if (typeof marked === 'undefined') return content;
        return marked.parse(content);
    }, [content]);

    return (
        <div className="flex flex-col items-center pdf-page-container">
            <h3 className="font-doodle text-lg font-bold text-black dark:text-white mb-2">PAGE: TOTAL SUMMARY</h3>
            <div className="w-full aspect-[8.5/11] p-8 sm:p-12 paper-texture hand-drawn-border-summary flex flex-col items-center justify-center">
                <div
                    className="notebook-content w-full"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </div>
        </div>
    );
};

const Exercise: React.FC<{ content: string, index: number }> = ({ content, index }) => {
    const [questionPart, answerPart] = useMemo(() => content.split('---'), [content]);
    const [showAnswer, setShowAnswer] = useState(false);
    
    const questionHtml = useMemo(() => {
        if (typeof marked === 'undefined' || !questionPart) return '';
        // Re-add the question number, which was removed during the split
        return marked.parse(`**Q${index}:** ${questionPart}`);
    }, [questionPart, index]);

    const answerHtml = useMemo(() => {
        if (typeof marked === 'undefined' || !answerPart) return '';
        // Embolden the answer label (A1, A2, etc.)
        const answerWithLabel = answerPart.replace(`A${index}:`, `**A${index}:**`);
        return marked.parse(answerWithLabel);
    }, [answerPart, index]);

    return (
        <div className="py-4 border-b-2 border-dashed border-gray-300 dark:border-gray-700 last:border-b-0">
            <div dangerouslySetInnerHTML={{ __html: questionHtml }} />
            <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="font-doodle text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mt-3 font-semibold"
            >
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
            {showAnswer && (
                <div className="mt-2 p-3 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-md" dangerouslySetInnerHTML={{ __html: answerHtml }} />
            )}
        </div>
    )
};


const MiniExercisePage: React.FC<{ content: string }> = ({ content }) => {
    const { title, questionBlocks } = useMemo(() => {
        const lines = content.split('\n');
        const title = lines[0] || '';
        const rest = lines.slice(1).join('\n');
        // Split by the question number pattern (Q1:, Q2:) but keep the content
        const blocks = rest.split(/Q\d+:/).filter(s => s.trim());
        return { title, questionBlocks: blocks };
    }, [content]);

    const titleHtml = useMemo(() => {
        if (typeof marked === 'undefined') return '';
        return marked.parse(title);
    }, [title]);

    return (
        <div className="flex flex-col items-center pdf-page-container">
            <h3 className="font-doodle text-lg font-bold text-black dark:text-white mb-2">PAGE: MINI EXERCISE</h3>
            <div className="w-full aspect-[8.5/11] p-8 sm:p-12 paper-texture hand-drawn-border-summary flex flex-col notebook-content">
                <div
                    className="text-center"
                    dangerouslySetInnerHTML={{ __html: titleHtml }}
                />
                <div className="mt-4 flex-grow overflow-y-auto pr-4 -mr-4">
                    {questionBlocks.map((block, i) => (
                        <Exercise key={i} content={block} index={i + 1} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const DownloadOverlay: React.FC<{ progress: string }> = ({ progress }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex flex-col items-center justify-center text-white animate-fade-in">
        <SpinnerIcon className="w-16 h-16" />
        <h3 className="mt-4 text-xl font-bold">Generating Your PDF...</h3>
        <p className="mt-1 text-white/80">{progress}</p>
        <style>{`.animate-fade-in { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
);


const ResultsView: React.FC<ResultsViewProps> = ({ document, onUpdateDocument, onReset, onShowNotebook, scrollTarget, onClearScrollTarget }) => {
    const [focusedDoodleUrl, setFocusedDoodleUrl] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState('');
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);
    
    const { pdfPages, chunkSummaries, totalSummary, miniExercise, userNotes } = document;

    useEffect(() => {
        if (scrollTarget && scrollTarget.docId === document.id) {
            // Use timeout to ensure the element is in the DOM
            setTimeout(() => {
                const pageElement = window.document.getElementById(`page-${scrollTarget.pageNumber}`);
                if (pageElement) {
                    pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Optional: add a temporary highlight effect
                    pageElement.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-8', 'transition-all', 'duration-1000');
                    setTimeout(() => {
                        pageElement.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-8');
                    }, 2000);
                }
                onClearScrollTarget(); // Clear after use
            }, 100);
        }
    }, [scrollTarget, document.id, onClearScrollTarget]);

    const summariesByPage = useMemo(() => {
        const map = new Map<number, ChunkSummary[]>();
        chunkSummaries.forEach(summary => {
            const pageNum = summary.pageNumber;
            if (!map.has(pageNum)) {
                map.set(pageNum, []);
            }
            map.get(pageNum)?.push(summary);
        });
        return map;
    }, [chunkSummaries]);
    
    const userNotesByPage = useMemo(() => {
        const map = new Map<number, UserNote[]>();
        userNotes.forEach(note => {
            const pageNum = note.pageNumber;
            if (!map.has(pageNum)) {
                map.set(pageNum, []);
            }
            map.get(pageNum)?.push(note);
        });
        return map;
    }, [userNotes]);

    const initialLayouts = useMemo(() => {
      const layouts: { [key: string]: React.CSSProperties } = {};
      pdfPages.forEach(page => {
        const pageSummaries = summariesByPage.get(page.pageNumber) || [];
        const numSummaries = pageSummaries.length;
        const verticalPadding = 8;
        const availableHeight = 100 - (verticalPadding * 2);
        const slotHeight = numSummaries > 0 ? availableHeight / numSummaries : availableHeight;

        pageSummaries.forEach((summary, index) => {
          const isLeftAligned = index % 2 === 0;
          let baseTop = verticalPadding + (index * slotHeight);
          const topJitter = slotHeight > 15 ? (Math.random() - 0.5) * (slotHeight * 0.1) : 0;
          baseTop = Math.max(verticalPadding, baseTop + topJitter);

          layouts[`summary-${page.pageNumber}-${index}`] = {
            width: '35%', height: '15%',
            transform: `rotate(${Math.random() * 5 - 2.5}deg)`,
            top: `${baseTop}%`, left: isLeftAligned ? '5%' : '60%', zIndex: 20,
          };
          if (summary.doodleUrl) {
            layouts[`doodle-${page.pageNumber}-${index}`] = {
              width: '30%', aspectRatio: '1 / 1',
              transform: `rotate(${Math.random() * 8 - 4}deg)`,
              top: `${baseTop + (Math.random() * 4 - 2)}%`, left: isLeftAligned ? '50%' : '15%', zIndex: 21,
            };
          }
        });
      });
      return layouts;
    }, [pdfPages, summariesByPage]);

    // For now, we only persist user notes layout. AI layouts are regenerated.
    const [aiLayouts] = useState(initialLayouts);

    const handleNoteAdd = (pageNumber: number) => {
      const newNote: UserNote = {
        id: `note-${Date.now()}`,
        pageNumber,
        createdAt: new Date(),
        content: "## New Note\n\nDouble-click to edit me!",
        style: {
          top: '40%',
          left: '35%',
          width: '30%',
          height: 'auto',
          zIndex: 30,
          transform: `rotate(${Math.random() * 4 - 2}deg)`,
        },
      };
      onUpdateDocument({ ...document, userNotes: [...document.userNotes, newNote] });
    };

    const handleNoteUpdate = (updatedNote: UserNote) => {
      const newNotes = document.userNotes.map(n => n.id === updatedNote.id ? updatedNote : n);
      onUpdateDocument({ ...document, userNotes: newNotes });
    };

    const handleNoteDelete = (noteId: string) => {
      const newNotes = document.userNotes.filter(n => n.id !== noteId);
      onUpdateDocument({ ...document, userNotes: newNotes });
    };
    
    const handleAiLayoutChange = () => {
      // In a real app, you'd persist these changes. For now, they reset on refresh.
      // console.log("AI Item layout changed:", { itemType, pageNumber, summaryIndex, newStyle });
    };
    
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
          setShowDownloadOptions(false);
        }
      };
      window.document.addEventListener("mousedown", handleClickOutside);
      return () => window.document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDownloadPdf = async (quality: 'low' | 'std' | 'high') => {
        if (isDownloading) return;
        setIsDownloading(true);
        setDownloadProgress('Starting PDF generation...');
        setShowDownloadOptions(false);
    
        const scaleMap = { low: 1, std: 2, high: 3 };
        const scale = scaleMap[quality];
    
        // Use a slight delay to allow the UI to update with the initial progress message
        await new Promise(resolve => setTimeout(resolve, 50));

        const pageElements = window.document.querySelectorAll('.pdf-page-container');
        if (pageElements.length === 0) {
            console.error("No pages found to render to PDF.");
            setIsDownloading(false);
            setDownloadProgress('');
            return;
        }

        const { jsPDF } = jspdf;
        const pdf = new jsPDF('p', 'pt', 'letter');
    
        for (let i = 0; i < pageElements.length; i++) {
            setDownloadProgress(`Rendering page ${i + 1} of ${pageElements.length}...`);
            // Allow UI to re-render with progress update
            await new Promise(resolve => setTimeout(resolve, 20));

            const element = pageElements[i] as HTMLElement;
            try {
                const canvas = await html2canvas(element, { 
                    scale: scale,
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (doc) => {
                      Array.from(doc.querySelectorAll(".group")).forEach((el: Element) => {
                        el.classList.remove("group");
                      });
                      // Ensure textareas show content, not the input field
                      Array.from(doc.querySelectorAll("textarea")).forEach((ta: HTMLTextAreaElement) => {
                          const div = doc.createElement('div');
                          div.innerHTML = ta.value.replace(/\n/g, '<br>');
                          div.className = ta.className;
                          div.style.cssText = ta.style.cssText;
                          ta.parentNode?.replaceChild(div, ta);
                      });
                    }
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                if (i > 0) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            } catch(e) {
                console.error("Failed to render page to canvas:", e);
            }
        }
    
        setDownloadProgress('Finalizing PDF...');
        await new Promise(resolve => setTimeout(resolve, 20));
        
        pdf.save(`${document.fileName.replace('.pdf', '')}-summary.pdf`);
        setIsDownloading(false);
        setDownloadProgress('');
    };


    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-stretch">
            {isDownloading && <DownloadOverlay progress={downloadProgress} />}
            {showShareModal && <ShareModal documentId={document.id} onClose={() => setShowShareModal(false)} />}
            {/* Header and Reset Button */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 px-1">
                 <div className="flex flex-col items-center sm:items-start">
                    <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
                        Your Doodle Summary
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate max-w-xs">{document.fileName}</p>
                 </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onShowNotebook}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                    >
                        <NotebookIcon className="w-4 h-4" />
                        View as Notes
                    </button>

                    <div className="relative" ref={downloadMenuRef}>
                      <button
                        onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        Download
                      </button>
                      {showDownloadOptions && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                          <ul className="py-1">
                            <li className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">Select Quality:</li>
                            <li><button onClick={() => handleDownloadPdf('low')} className="w-full text-left px-3 py-1 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Low (Fast)</button></li>
                            <li><button onClick={() => handleDownloadPdf('std')} className="w-full text-left px-3 py-1 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Standard (Recommended)</button></li>
                            <li><button onClick={() => handleDownloadPdf('high')} className="w-full text-left px-3 py-1 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">High (Best)</button></li>
                          </ul>
                        </div>
                      )}
                    </div>

                    <button
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 text-sm font-semibold rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                    >
                        <ShareIcon className="w-4 h-4" />
                        Share
                    </button>
                    
                    <button
                        onClick={onReset}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                    >
                        Dashboard
                    </button>
                </div>
            </div>
            
            <div id="pdf-content" className="space-y-8">
                {pdfPages.map((page) => (
                    <DraggablePage 
                        key={page.pageNumber}
                        page={page}
                        chunkSummaries={summariesByPage.get(page.pageNumber) || []}
                        userNotes={userNotesByPage.get(page.pageNumber) || []}
                        onNoteAdd={handleNoteAdd}
                        onNoteUpdate={handleNoteUpdate}
                        onNoteDelete={handleNoteDelete}
                        onLayoutChange={handleAiLayoutChange}
                        layouts={aiLayouts}
                        pageCount={pdfPages.length}
                        onDoodleDoubleClick={(url) => setFocusedDoodleUrl(url)}
                        pdfDataUrl={(document as any).sourcePdfDataUrl}
                    />
                ))}
                {totalSummary && <TotalSummaryPage content={totalSummary} />}
                {miniExercise && <MiniExercisePage content={miniExercise} />}
            </div>

            {focusedDoodleUrl && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 cursor-zoom-out transition-opacity duration-300 animate-fade-in"
                    onClick={() => setFocusedDoodleUrl(null)}
                    aria-modal="true"
                    role="dialog"
                >
                    <style>{`.animate-fade-in { animation: fadeIn 0.3s ease; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
                    <img
                        src={focusedDoodleUrl}
                        alt="Focused doodle"
                        className="max-w-[90vw] max-h-[90vh] object-contain cursor-default drop-shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ResultsView;
