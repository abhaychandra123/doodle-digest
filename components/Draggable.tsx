import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DraggableProps {
  children: React.ReactNode;
  style: React.CSSProperties;
  parentRef: React.RefObject<HTMLDivElement>;
  onLayoutChange: (newStyle: React.CSSProperties) => void;
  isResizable?: boolean;
  isEditingDisabled?: boolean;
  onDoubleClick?: () => void;
}

const Draggable: React.FC<DraggableProps> = ({
  children,
  style,
  parentRef,
  onLayoutChange,
  isResizable = false,
  isEditingDisabled = false,
  onDoubleClick,
}) => {
  const [currentStyle, setCurrentStyle] = useState(style);
  const [activeAction, setActiveAction] = useState<'drag' | 'resize' | null>(null);

  const actionStartRef = useRef<{
    x: number;
    y: number;
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    setCurrentStyle(style);
  }, [style]);

  const handleActionStart = (e: React.MouseEvent<HTMLDivElement>, action: 'drag' | 'resize') => {
    if (e.button !== 0 || isEditingDisabled) return;
    e.preventDefault();
    e.stopPropagation();

    setActiveAction(action);
    
    const rect = (e.currentTarget.offsetParent as HTMLElement).getBoundingClientRect();
    const parentRect = parentRef.current!.getBoundingClientRect();

    actionStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      top: ((rect.top - parentRect.top) / parentRect.height) * 100,
      left: ((rect.left - parentRect.left) / parentRect.width) * 100,
      width: (rect.width / parentRect.width) * 100,
      height: (rect.height / parentRect.height) * 100,
    };

    window.document.body.style.cursor = action === 'drag' ? 'grabbing' : 'se-resize';
    window.document.body.style.userSelect = 'none';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeAction || !actionStartRef.current || !parentRef.current) return;
    
    const parentRect = parentRef.current.getBoundingClientRect();
    
    if (activeAction === 'drag') {
      const dx = e.clientX - actionStartRef.current.x;
      const dy = e.clientY - actionStartRef.current.y;
      const newLeft = actionStartRef.current.left + (dx / parentRect.width) * 100;
      const newTop = actionStartRef.current.top + (dy / parentRect.height) * 100;
      setCurrentStyle(prev => ({ ...prev, top: `${newTop}%`, left: `${newLeft}%` }));
    } else if (activeAction === 'resize') {
      const dx = e.clientX - actionStartRef.current.x;
      const initialWidthPx = (actionStartRef.current.width / 100) * parentRect.width;
      const newWidthPx = initialWidthPx + dx;
      const newWidthPercent = (newWidthPx / parentRect.width) * 100;

      if (newWidthPercent > 10 && newWidthPercent < 90) { 
        setCurrentStyle(prev => ({ ...prev, width: `${newWidthPercent}%`, height: 'auto' }));
      }
    }
  }, [activeAction, parentRef]);

  const handleMouseUp = useCallback(() => {
    if (!activeAction) return;
    onLayoutChange(currentStyle);
    
    setActiveAction(null);
    actionStartRef.current = null;
    window.document.body.style.cursor = 'default';
    window.document.body.style.userSelect = '';
  }, [activeAction, onLayoutChange, currentStyle]);

  useEffect(() => {
    if (activeAction) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeAction, handleMouseMove, handleMouseUp]);

  const outerStyle: React.CSSProperties = {
    position: 'absolute',
    ...currentStyle,
    zIndex: activeAction ? 55 : (currentStyle.zIndex || 10),
    cursor: activeAction === 'drag' ? 'grabbing' : (isEditingDisabled ? 'default' : 'grab'),
  };

  return (
    <div
      onMouseDown={(e) => handleActionStart(e, 'drag')}
      style={outerStyle}
      className="group"
    >
      <div
        onDoubleClick={!isEditingDisabled ? onDoubleClick : undefined}
        style={{ width: '100%', height: '100%', position: 'relative' }}
        className="transition-transform duration-200 ease-in-out group-hover:scale-105"
      >
        {children}
      </div>
      {isResizable && (
        <div
          onMouseDown={(e) => handleActionStart(e, 'resize')}
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-white dark:bg-gray-300 border-2 border-indigo-500 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
          title="Resize item"
        />
      )}
    </div>
  );
};

export default Draggable;