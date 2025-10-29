import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BoldIcon } from './icons/BoldIcon';
import { ItalicIcon } from './icons/ItalicIcon';
import { HeadingIcon } from './icons/HeadingIcon';
import { ListIcon } from './icons/ListIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  onAISuggest: () => void;
  isSuggesting: boolean;
}

const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<number | null>(null);

  return (...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

const ToolbarButton: React.FC<{
  label: string;
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, isActive, children }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`p-2 docs-toolbar-button ${isActive ? 'active' : ''}`}
  >
    {children}
  </button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent, onChange, onAISuggest, isSuggesting }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const debouncedOnChange = useDebounce(onChange, 500);

  const handleInput = () => {
    if (editorRef.current) {
      debouncedOnChange(editorRef.current.innerHTML);
    }
  };
  
  const updateActiveFormats = useCallback(() => {
    const newActiveFormats = new Set<string>();
    if (document.queryCommandState('bold')) newActiveFormats.add('bold');
    if (document.queryCommandState('italic')) newActiveFormats.add('italic');
    if (document.queryCommandState('insertUnorderedList')) newActiveFormats.add('ul');
    
    // Check for heading
    let node = window.getSelection()?.anchorNode;
    while(node && node.nodeName !== 'BODY') {
        if(node.nodeName === 'H2') {
            newActiveFormats.add('h2');
            break;
        }
        node = node.parentNode;
    }

    setActiveFormats(newActiveFormats);
  }, []);


  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
    // Set initial active formats
    updateActiveFormats();

    const handleSelectionChange = () => {
        updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [initialContent, updateActiveFormats]);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  const toggleHeading = () => {
    const isH2 = activeFormats.has('h2');
    handleFormat('formatBlock', isH2 ? 'p' : 'h2');
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden">
      <div className="docs-toolbar flex-shrink-0 p-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ToolbarButton label="Bold" onClick={() => handleFormat('bold')} isActive={activeFormats.has('bold')}>
            <BoldIcon className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => handleFormat('italic')} isActive={activeFormats.has('italic')}>
            <ItalicIcon className="w-5 h-5" />
          </ToolbarButton>
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
          <ToolbarButton label="Heading" onClick={toggleHeading} isActive={activeFormats.has('h2')}>
            <HeadingIcon className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton label="Bulleted List" onClick={() => handleFormat('insertUnorderedList')} isActive={activeFormats.has('ul')}>
            <ListIcon className="w-5 h-5" />
          </ToolbarButton>
        </div>
        <div>
            <button 
                onClick={onAISuggest}
                disabled={isSuggesting}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-50 disabled:cursor-wait transition-colors"
                >
                {isSuggesting ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                AI Assist
            </button>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onClick={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        className="flex-grow p-8 md:p-12 text-slate-900 dark:text-slate-100 text-base writing-editor-content overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: initialContent }}
      />
    </div>
  );
};

export default RichTextEditor;