'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

interface SplitPanelProps {
  orientation: 'horizontal' | 'vertical';
  initialSizes: number[];
  minSizes?: number[];
  maxSizes?: number[];
  children: React.ReactNode[];
  className?: string;
  onResize?: (sizes: number[]) => void;
  resizable?: boolean;
  collapsible?: boolean;
}

export function SplitPanel({
  orientation,
  initialSizes,
  minSizes = [],
  maxSizes = [],
  children,
  className,
  onResize,
  resizable = true,
  collapsible = false
}: SplitPanelProps) {
  const [sizes, setSizes] = useState<number[]>(initialSizes);
  const [isResizing, setIsResizing] = useState(false);
  const panelGroupRef = useRef<HTMLDivElement>(null);

  // Validate that we have the correct number of children
  if (children.length !== initialSizes.length) {
    throw new Error('Number of children must match number of initial sizes');
  }

  // Handle resize
  const handleResize = useCallback((newSizes: number[]) => {
    setSizes(newSizes);
    onResize?.(newSizes);
  }, [onResize]);

  // Handle resize start
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Normalize sizes to ensure they add up to 100
  const normalizeSizes = useCallback((sizes: number[]): number[] => {
    const total = sizes.reduce((sum, size) => sum + size, 0);
    if (total === 0) return sizes;
    return sizes.map(size => (size / total) * 100);
  }, []);

  // Get normalized sizes
  const normalizedSizes = normalizeSizes(sizes);

  return (
    <ResizablePanelGroup
      ref={panelGroupRef}
      direction={orientation}
      className={cn('h-full w-full', className)}
      onLayout={handleResize}
      style={{
        cursor: isResizing ? (orientation === 'horizontal' ? 'col-resize' : 'row-resize') : 'default'
      }}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <ResizablePanel
            id={`panel-${index}`}
            defaultSize={normalizedSizes[index]}
            minSize={minSizes[index]}
            maxSize={maxSizes[index]}
            collapsible={collapsible}
            className={cn(
              'flex flex-col overflow-hidden',
              isResizing && 'pointer-events-none select-none'
            )}
          >
            <div className="flex-1 overflow-hidden">
              {child}
            </div>
          </ResizablePanel>
          
          {/* Add resize handle between panels (except after the last one) */}
          {index < children.length - 1 && resizable && (
            <ResizableHandle
              className={cn(
                'group relative transition-colors',
                orientation === 'horizontal' ? 'w-1' : 'h-1',
                'bg-border hover:bg-accent',
                'data-[resize-handle-active]:bg-accent',
                'data-[resize-handle-active]:transition-none'
              )}
              onDragging={(isDragging) => {
                if (isDragging) {
                  handleResizeStart();
                } else {
                  handleResizeEnd();
                }
              }}
            >
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'data-[resize-handle-active]:opacity-100'
                )}
              >
                <div
                  className={cn(
                    'bg-accent-foreground/20 rounded-full',
                    orientation === 'horizontal' ? 'w-1 h-4' : 'w-4 h-1'
                  )}
                />
              </div>
            </ResizableHandle>
          )}
        </React.Fragment>
      ))}
    </ResizablePanelGroup>
  );
}

// Convenience components for common layouts
export function HorizontalSplitPanel({
  children,
  initialSizes,
  ...props
}: Omit<SplitPanelProps, 'orientation'>) {
  return (
    <SplitPanel
      orientation="horizontal"
      initialSizes={initialSizes}
      {...props}
    >
      {children}
    </SplitPanel>
  );
}

export function VerticalSplitPanel({
  children,
  initialSizes,
  ...props
}: Omit<SplitPanelProps, 'orientation'>) {
  return (
    <SplitPanel
      orientation="vertical"
      initialSizes={initialSizes}
      {...props}
    >
      {children}
    </SplitPanel>
  );
}

// Three-panel layout (common for IDEs)
export function ThreePanelLayout({
  left,
  center,
  right,
  leftSize = 20,
  centerSize = 60,
  rightSize = 20,
  className,
  ...props
}: {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  leftSize?: number;
  centerSize?: number;
  rightSize?: number;
  className?: string;
} & Omit<SplitPanelProps, 'orientation' | 'initialSizes' | 'children'>) {
  return (
    <SplitPanel
      orientation="horizontal"
      initialSizes={[leftSize, centerSize, rightSize]}
      minSizes={[10, 30, 10]}
      className={className}
      {...props}
    >
      {[left, center, right]}
    </SplitPanel>
  );
}

// IDE-style layout with file explorer, editor, and terminal
export function IDELayout({
  fileExplorer,
  editor,
  terminal,
  aiAssistant,
  explorerSize = 20,
  editorSize = 50,
  terminalSize = 30,
  aiSize = 25,
  showAI = true,
  className,
  ...props
}: {
  fileExplorer: React.ReactNode;
  editor: React.ReactNode;
  terminal: React.ReactNode;
  aiAssistant?: React.ReactNode;
  explorerSize?: number;
  editorSize?: number;
  terminalSize?: number;
  aiSize?: number;
  showAI?: boolean;
  className?: string;
} & Omit<SplitPanelProps, 'orientation' | 'initialSizes' | 'children'>) {
  if (showAI && aiAssistant) {
    return (
      <SplitPanel
        orientation="horizontal"
        initialSizes={[explorerSize, editorSize + terminalSize, aiSize]}
        minSizes={[10, 40, 15]}
        className={className}
        {...props}
      >
        {[
          fileExplorer,
          <SplitPanel
            orientation="vertical"
            initialSizes={[editorSize, terminalSize]}
            minSizes={[20, 15]}
            key="editor-terminal"
          >
            {[editor, terminal]}
          </SplitPanel>,
          aiAssistant
        ]}
      </SplitPanel>
    );
  }

  return (
    <SplitPanel
      orientation="horizontal"
      initialSizes={[explorerSize, editorSize + terminalSize]}
      minSizes={[10, 50]}
      className={className}
      {...props}
    >
      {[
        fileExplorer,
        <SplitPanel
          orientation="vertical"
          initialSizes={[editorSize, terminalSize]}
          minSizes={[20, 15]}
          key="editor-terminal"
        >
          {[editor, terminal]}
        </SplitPanel>
      ]}
    </SplitPanel>
  );
}

// Grid layout for multiple panels
export function GridLayout({
  children,
  rows = 2,
  cols = 2,
  className,
  ...props
}: {
  children: React.ReactNode[];
  rows?: number;
  cols?: number;
  className?: string;
} & Omit<SplitPanelProps, 'orientation' | 'initialSizes' | 'children'>) {
  const totalPanels = rows * cols;
  const expectedChildren = Math.min(children.length, totalPanels);
  const sizePerPanel = 100 / expectedChildren;
  
  // Create row structure
  const rowChildren = [];
  for (let i = 0; i < rows; i++) {
    const startIndex = i * cols;
    const endIndex = Math.min(startIndex + cols, children.length);
    const rowItems = children.slice(startIndex, endIndex);
    
    if (rowItems.length === 0) break;
    
    const colSizes = new Array(rowItems.length).fill(100 / rowItems.length);
    
    rowChildren.push(
      <SplitPanel
        key={i}
        orientation="horizontal"
        initialSizes={colSizes}
        minSizes={colSizes.map(() => 10)}
        resizable={true}
      >
        {rowItems}
      </SplitPanel>
    );
  }
  
  const rowSizes = new Array(rowChildren.length).fill(100 / rowChildren.length);
  
  return (
    <SplitPanel
      orientation="vertical"
      initialSizes={rowSizes}
      minSizes={rowSizes.map(() => 10)}
      className={className}
      {...props}
    >
      {rowChildren}
    </SplitPanel>
  );
}