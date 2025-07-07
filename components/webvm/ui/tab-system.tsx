'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Plus, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Terminal,
  Bot,
  Settings,
  Circle,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface TabItem {
  id: string;
  title: string;
  type: 'file' | 'terminal' | 'ai' | 'settings' | 'browser';
  content: React.ReactNode;
  isDirty?: boolean;
  isActive?: boolean;
  canClose?: boolean;
  icon?: React.ReactNode;
  path?: string;
  language?: string;
}

interface TabSystemProps {
  tabs: TabItem[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabAdd?: () => void;
  onTabSave?: (tabId: string) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  className?: string;
  showAddButton?: boolean;
  maxTabWidth?: number;
  minTabWidth?: number;
}

export function TabSystem({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onTabAdd,
  onTabSave,
  onTabReorder,
  className,
  showAddButton = true,
  maxTabWidth = 200,
  minTabWidth = 120
}: TabSystemProps) {
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  const getTabIcon = (type: TabItem['type'], customIcon?: React.ReactNode) => {
    if (customIcon) return customIcon;
    
    switch (type) {
      case 'file':
        return <FileText className="h-3 w-3" />;
      case 'terminal':
        return <Terminal className="h-3 w-3" />;
      case 'ai':
        return <Bot className="h-3 w-3" />;
      case 'settings':
        return <Settings className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const updateScrollButtons = useCallback(() => {
    if (!tabsScrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [tabs, updateScrollButtons]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsScrollRef.current) return;
    
    const scrollAmount = 120;
    const newScrollPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;
    
    tabsScrollRef.current.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    });
    setScrollPosition(newScrollPosition);
  };

  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose?.(tabId);
  };

  const handleTabSave = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabSave?.(tabId);
  };

  const handleDragStart = (e: React.DragEvent, tabId: string, index: number) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
    
    // Create drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(5deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedTab) return;
    
    const dragIndex = tabs.findIndex(tab => tab.id === draggedTab);
    if (dragIndex !== -1 && dragIndex !== dropIndex) {
      onTabReorder?.(dragIndex, dropIndex);
    }
    
    setDraggedTab(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverIndex(null);
  };

  const getTabWidth = () => {
    const containerWidth = tabsContainerRef.current?.clientWidth || 0;
    const availableWidth = containerWidth - (showAddButton ? 32 : 0) - 64; // Account for scroll buttons
    const idealWidth = Math.max(minTabWidth, Math.min(maxTabWidth, availableWidth / tabs.length));
    return Math.floor(idealWidth);
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Tab Bar */}
      <div 
        ref={tabsContainerRef}
        className="flex items-center bg-muted/30 border-b border-border min-h-[36px]"
      >
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => scrollTabs('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Tabs Container */}
        <div 
          ref={tabsScrollRef}
          className="flex-1 overflow-x-auto scrollbar-none"
          onScroll={updateScrollButtons}
        >
          <div className="flex">
            {tabs.map((tab, index) => {
              const isActive = tab.id === activeTabId;
              const isDragging = draggedTab === tab.id;
              const isDropTarget = dragOverIndex === index;
              
              return (
                <div
                  key={tab.id}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer transition-all duration-150 group shrink-0",
                    "hover:bg-muted/50",
                    isActive && "bg-background border-b-2 border-b-primary text-foreground",
                    !isActive && "text-muted-foreground",
                    isDragging && "opacity-50",
                    isDropTarget && "bg-primary/10"
                  )}
                  style={{ width: `${getTabWidth()}px` }}
                  onClick={() => handleTabClick(tab.id)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tab.id, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Tab Icon */}
                  <div className="shrink-0">
                    {getTabIcon(tab.type, tab.icon)}
                  </div>

                  {/* Tab Title */}
                  <span className="truncate text-sm font-medium flex-1">
                    {tab.title}
                  </span>

                  {/* Dirty Indicator */}
                  {tab.isDirty && (
                    <div className="shrink-0">
                      <Circle className="h-2 w-2 fill-orange-500 text-orange-500" />
                    </div>
                  )}

                  {/* Tab Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {tab.isDirty && onTabSave && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-primary/20"
                        onClick={(e) => handleTabSave(e, tab.id)}
                        title="Save"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {tab.canClose !== false && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive/20"
                        onClick={(e) => handleTabClose(e, tab.id)}
                        title="Close"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Drop Indicator */}
                  {isDropTarget && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => scrollTabs('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Add Tab Button */}
        {showAddButton && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0 mx-1"
            onClick={onTabAdd}
            title="New Tab"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        {/* Tab Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0 mr-1"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {tabs.map((tab) => (
              <DropdownMenuItem
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "flex items-center gap-2",
                  tab.id === activeTabId && "bg-muted"
                )}
              >
                {getTabIcon(tab.type, tab.icon)}
                <span className="truncate">{tab.title}</span>
                {tab.isDirty && (
                  <Circle className="h-2 w-2 fill-orange-500 text-orange-500 ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
            {tabs.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => {
              tabs.forEach(tab => {
                if (tab.canClose !== false) {
                  onTabClose?.(tab.id);
                }
              });
            }}>
              Close All Tabs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              tabs.forEach(tab => {
                if (tab.isDirty && onTabSave) {
                  onTabSave(tab.id);
                }
              });
            }}>
              Save All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <div className="h-full">
            {activeTab.content}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Active Tab</h3>
              <p className="text-sm">Open a file or create a new tab to get started</p>
              {showAddButton && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={onTabAdd}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Tab
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
