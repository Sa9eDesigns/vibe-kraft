'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabSystem, TabItem } from './tab-system';
import {
  X,
  Plus,
  MoreHorizontal,
  FileText,
  Terminal as TerminalIcon,
  Folder,
  Bot,
  Settings,
  Split,
  Maximize2,
  Minimize2,
  RotateCcw,
  GripVertical,
  GripHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tab types
export type TabType = 'editor' | 'terminal' | 'browser' | 'ai' | 'settings';

export interface Tab {
  id: string;
  title: string;
  type: TabType;
  content: React.ReactNode;
  isDirty?: boolean;
  isActive?: boolean;
  canClose?: boolean;
  icon?: React.ReactNode;
  path?: string;
}

export interface Panel {
  id: string;
  title: string;
  tabs: Tab[];
  activeTabId?: string;
  size: number; // percentage
  minSize: number;
  maxSize?: number;
  isCollapsed?: boolean;
  canCollapse?: boolean;
}

interface WorkspaceInterfaceProps {
  panels: Panel[];
  onPanelResize?: (panelId: string, newSize: number) => void;
  onTabChange?: (panelId: string, tabId: string) => void;
  onTabClose?: (panelId: string, tabId: string) => void;
  onTabAdd?: (panelId: string, type: TabType) => void;
  onPanelCollapse?: (panelId: string, collapsed: boolean) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function WorkspaceInterface({
  panels,
  onPanelResize,
  onTabChange,
  onTabClose,
  onTabAdd,
  onPanelCollapse,
  className,
  orientation = 'horizontal'
}: WorkspaceInterfaceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPanelIndex, setDragPanelIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<number>(0);
  const startSizesRef = useRef<number[]>([]);

  const getTabIcon = (type: TabType) => {
    switch (type) {
      case 'editor':
        return <FileText className="h-3 w-3" />;
      case 'terminal':
        return <TerminalIcon className="h-3 w-3" />;
      case 'ai':
        return <Bot className="h-3 w-3" />;
      case 'settings':
        return <Settings className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, panelIndex: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDragPanelIndex(panelIndex);
    startPosRef.current = orientation === 'horizontal' ? e.clientX : e.clientY;
    startSizesRef.current = panels.map(p => p.size);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize = orientation === 'horizontal' 
        ? containerRect.width 
        : containerRect.height;
      
      const currentPos = orientation === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      const deltaPercent = (delta / containerSize) * 100;

      const newSizes = [...startSizesRef.current];
      const currentPanel = panels[panelIndex];
      const nextPanel = panels[panelIndex + 1];

      if (!currentPanel || !nextPanel) return;

      // Calculate new sizes
      const newCurrentSize = Math.max(
        currentPanel.minSize,
        Math.min(currentPanel.maxSize || 80, newSizes[panelIndex] + deltaPercent)
      );
      const newNextSize = Math.max(
        nextPanel.minSize,
        Math.min(nextPanel.maxSize || 80, newSizes[panelIndex + 1] - deltaPercent)
      );

      // Only update if both panels can accommodate the change
      if (newCurrentSize !== newSizes[panelIndex] && newNextSize !== newSizes[panelIndex + 1]) {
        onPanelResize?.(currentPanel.id, newCurrentSize);
        onPanelResize?.(nextPanel.id, newNextSize);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragPanelIndex(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panels, orientation, onPanelResize]);

  const handleTabClick = (panelId: string, tabId: string) => {
    onTabChange?.(panelId, tabId);
  };

  const handleTabClose = (e: React.MouseEvent, panelId: string, tabId: string) => {
    e.stopPropagation();
    onTabClose?.(panelId, tabId);
  };

  const handleAddTab = (panelId: string) => {
    onTabAdd?.(panelId, 'editor');
  };

  const togglePanelCollapse = (panelId: string, currentlyCollapsed: boolean) => {
    onPanelCollapse?.(panelId, !currentlyCollapsed);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex h-full bg-background",
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {panels.map((panel, index) => {
        const activeTab = panel.tabs.find(tab => tab.id === panel.activeTabId) || panel.tabs[0];
        const isCollapsed = panel.isCollapsed;
        
        return (
          <React.Fragment key={panel.id}>
            {/* Panel */}
            <div
              className={cn(
                "flex flex-col border-r border-border bg-background",
                orientation === 'vertical' && "border-r-0 border-b",
                isCollapsed && "min-w-0 min-h-0"
              )}
              style={{
                [orientation === 'horizontal' ? 'width' : 'height']: 
                  isCollapsed ? 'auto' : `${panel.size}%`,
                minWidth: isCollapsed ? 'auto' : orientation === 'horizontal' ? `${panel.minSize}%` : undefined,
                minHeight: isCollapsed ? 'auto' : orientation === 'vertical' ? `${panel.minSize}%` : undefined
              }}
            >
              {/* Tab Bar */}
              <div className="flex items-center justify-between bg-muted/30 border-b border-border px-2 py-1 min-h-[32px]">
                <div className="flex items-center gap-1 flex-1 overflow-hidden">
                  {!isCollapsed && (
                    <>
                      {/* Tabs */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {panel.tabs.map((tab) => (
                          <div
                            key={tab.id}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors group",
                              "hover:bg-muted/50",
                              tab.id === panel.activeTabId 
                                ? "bg-background border border-border text-foreground" 
                                : "text-muted-foreground"
                            )}
                            onClick={() => handleTabClick(panel.id, tab.id)}
                          >
                            {tab.icon || getTabIcon(tab.type)}
                            <span className="truncate max-w-[100px]">{tab.title}</span>
                            {tab.isDirty && (
                              <div className="w-1 h-1 bg-orange-500 rounded-full" />
                            )}
                            {tab.canClose !== false && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-3 w-3 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20"
                                onClick={(e) => handleTabClose(e, panel.id, tab.id)}
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Tab Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleAddTab(panel.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Panel Controls */}
                <div className="flex items-center gap-1">
                  {panel.canCollapse !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => togglePanelCollapse(panel.id, isCollapsed || false)}
                    >
                      {isCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Panel Content */}
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  {activeTab ? (
                    <div className="h-full">
                      {activeTab.content}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active tab</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsed Panel Indicator */}
              {isCollapsed && (
                <div className="flex items-center justify-center p-2 writing-mode-vertical">
                  <span className="text-xs text-muted-foreground transform -rotate-90 whitespace-nowrap">
                    {panel.title}
                  </span>
                </div>
              )}
            </div>

            {/* Resizer */}
            {index < panels.length - 1 && (
              <div
                className={cn(
                  "bg-border hover:bg-border/80 transition-colors cursor-col-resize select-none",
                  orientation === 'horizontal' ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
                  isDragging && dragPanelIndex === index && "bg-primary"
                )}
                onMouseDown={(e) => handleMouseDown(e, index)}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
