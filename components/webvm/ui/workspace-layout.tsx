'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { WorkspaceInterface, Tab, Panel, TabType } from './workspace-interface';
import { CodeEditor } from './monaco-editor';
import { Terminal } from './terminal';
import { FileExplorer } from './file-explorer';
import { AIAssistant } from './ai-assistant';
import { WorkspaceManager } from './workspace-manager';
import { NetworkingConfig } from './networking-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Terminal as TerminalIcon, 
  Folder, 
  Bot, 
  Settings,
  Globe,
  Code,
  Plus,
  Layout
} from 'lucide-react';
import type { DevSandbox } from '../core/dev-sandbox';
import type { FileInfo, NetworkingConfig as NetworkingConfigType } from '../types';

interface WorkspaceLayoutProps {
  sandbox: DevSandbox | null;
  className?: string;
  onFileOpen?: (file: FileInfo) => void;
  onFileChange?: (path: string, content: string) => void;
  networkingConfig?: NetworkingConfigType;
  onNetworkingChange?: (config: NetworkingConfigType) => void;
}

interface OpenFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export function WorkspaceLayout({
  sandbox,
  className,
  onFileOpen,
  onFileChange,
  networkingConfig,
  onNetworkingChange
}: WorkspaceLayoutProps) {
  const [panels, setPanels] = useState<Panel[]>([
    {
      id: 'sidebar',
      title: 'Explorer',
      size: 20,
      minSize: 15,
      maxSize: 40,
      canCollapse: true,
      tabs: [
        {
          id: 'file-explorer',
          title: 'Files',
          type: 'editor',
          icon: <Folder className="h-3 w-3" />,
          content: <div />, // Will be populated
          canClose: false
        },
        {
          id: 'workspace-manager',
          title: 'Projects',
          type: 'editor',
          icon: <Layout className="h-3 w-3" />,
          content: <div />, // Will be populated
          canClose: false
        }
      ],
      activeTabId: 'file-explorer'
    },
    {
      id: 'main',
      title: 'Editor',
      size: 50,
      minSize: 30,
      tabs: [
        {
          id: 'welcome',
          title: 'Welcome',
          type: 'editor',
          icon: <Code className="h-3 w-3" />,
          content: <div />, // Will be populated
          canClose: false
        }
      ],
      activeTabId: 'welcome'
    },
    {
      id: 'bottom',
      title: 'Terminal',
      size: 30,
      minSize: 20,
      canCollapse: true,
      tabs: [
        {
          id: 'terminal-1',
          title: 'Terminal',
          type: 'terminal',
          icon: <TerminalIcon className="h-3 w-3" />,
          content: <div />, // Will be populated
          canClose: false
        },
        {
          id: 'ai-assistant',
          title: 'AI Assistant',
          type: 'ai',
          icon: <Bot className="h-3 w-3" />,
          content: <div />, // Will be populated
          canClose: false
        }
      ],
      activeTabId: 'terminal-1'
    }
  ]);

  const [openFiles, setOpenFiles] = useState<Map<string, OpenFile>>(new Map());
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Update panel contents when sandbox changes
  useEffect(() => {
    setPanels(prevPanels => prevPanels.map(panel => ({
      ...panel,
      tabs: panel.tabs.map(tab => ({
        ...tab,
        content: getTabContent(tab.id, tab.type)
      }))
    })));
  }, [sandbox, openFiles, activeFile, networkingConfig]);

  const getTabContent = (tabId: string, type: TabType): React.ReactNode => {
    switch (tabId) {
      case 'file-explorer':
        return (
          <FileExplorer
            sandbox={sandbox}
            onFileSelect={handleFileSelect}
            onFileCreate={handleFileCreate}
            onFileDelete={handleFileDelete}
            className="h-full"
          />
        );

      case 'workspace-manager':
        return (
          <WorkspaceManager
            sandbox={sandbox}
            onProjectSelect={(project) => {
              console.log('Selected project:', project);
            }}
            onProjectCreate={(project) => {
              console.log('Created project:', project);
            }}
            className="h-full"
          />
        );

      case 'welcome':
        return (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Code className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Welcome to WebVM Workspace</h3>
                  <p className="text-muted-foreground">
                    Open a file from the explorer or create a new project to get started
                  </p>
                </div>
                <Button onClick={() => handleTabAdd('main', 'editor')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New File
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'terminal-1':
        return (
          <Terminal
            sandbox={sandbox}
            className="h-full"
            onCommand={(command) => {
              console.log('Terminal command:', command);
            }}
          />
        );

      case 'ai-assistant':
        return (
          <AIAssistant
            sandbox={sandbox}
            className="h-full"
            onMessage={(message) => {
              console.log('AI message:', message);
            }}
          />
        );

      case 'networking-config':
        return (
          <NetworkingConfig
            config={networkingConfig || {
              tailscale: { enabled: false, authKey: '' },
              ssh: { enabled: false, keyPath: '', knownHosts: [] },
              portForwarding: { enabled: false, ports: [] }
            }}
            onChange={onNetworkingChange || (() => {})}
            className="h-full"
          />
        );

      default:
        // Handle file editor tabs
        if (tabId.startsWith('file:')) {
          const filePath = tabId.replace('file:', '');
          const file = openFiles.get(filePath);
          
          if (file) {
            return (
              <CodeEditor
                value={file.content}
                language={file.language}
                onChange={(value) => handleFileContentChange(filePath, value || '')}
                onSave={() => handleFileSave(filePath)}
                className="h-full"
                path={filePath}
              />
            );
          }
        }

        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Content not available</p>
            </div>
          </div>
        );
    }
  };

  const handleFileSelect = async (file: FileInfo) => {
    if (file.type === 'file' && sandbox) {
      try {
        const content = await sandbox.readFile(file.path);
        const language = getLanguageFromPath(file.path);
        
        const openFile: OpenFile = {
          path: file.path,
          content,
          language,
          isDirty: false
        };

        setOpenFiles(prev => new Map(prev).set(file.path, openFile));
        
        // Add tab to main panel
        const fileTabId = `file:${file.path}`;
        setPanels(prev => prev.map(panel => {
          if (panel.id === 'main') {
            const existingTab = panel.tabs.find(tab => tab.id === fileTabId);
            if (!existingTab) {
              return {
                ...panel,
                tabs: [...panel.tabs, {
                  id: fileTabId,
                  title: file.name,
                  type: 'editor' as TabType,
                  icon: <FileText className="h-3 w-3" />,
                  content: getTabContent(fileTabId, 'editor'),
                  isDirty: false,
                  path: file.path
                }],
                activeTabId: fileTabId
              };
            } else {
              return {
                ...panel,
                activeTabId: fileTabId
              };
            }
          }
          return panel;
        }));

        setActiveFile(file.path);
        onFileOpen?.(file);
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    }
  };

  const handleFileCreate = async (path: string, content: string = '') => {
    if (sandbox) {
      try {
        await sandbox.writeFile(path, content);
        // Refresh file explorer or handle file creation
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
  };

  const handleFileDelete = async (path: string) => {
    if (sandbox) {
      try {
        await sandbox.executeCommand('rm', [path]);
        // Close tab if open
        const fileTabId = `file:${path}`;
        setPanels(prev => prev.map(panel => ({
          ...panel,
          tabs: panel.tabs.filter(tab => tab.id !== fileTabId),
          activeTabId: panel.activeTabId === fileTabId ? panel.tabs[0]?.id : panel.activeTabId
        })));
        setOpenFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(path);
          return newMap;
        });
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  const handleFileContentChange = (path: string, content: string) => {
    setOpenFiles(prev => {
      const newMap = new Map(prev);
      const file = newMap.get(path);
      if (file) {
        newMap.set(path, { ...file, content, isDirty: true });
      }
      return newMap;
    });

    // Update tab dirty state
    setPanels(prev => prev.map(panel => ({
      ...panel,
      tabs: panel.tabs.map(tab => 
        tab.path === path ? { ...tab, isDirty: true } : tab
      )
    })));

    onFileChange?.(path, content);
  };

  const handleFileSave = async (path: string) => {
    const file = openFiles.get(path);
    if (file && sandbox) {
      try {
        await sandbox.writeFile(path, file.content);
        setOpenFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(path, { ...file, isDirty: false });
          return newMap;
        });

        // Update tab dirty state
        setPanels(prev => prev.map(panel => ({
          ...panel,
          tabs: panel.tabs.map(tab => 
            tab.path === path ? { ...tab, isDirty: false } : tab
          )
        })));
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  };

  const handlePanelResize = (panelId: string, newSize: number) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId ? { ...panel, size: newSize } : panel
    ));
  };

  const handleTabChange = (panelId: string, tabId: string) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId ? { ...panel, activeTabId: tabId } : panel
    ));

    // Update active file if it's a file tab
    if (tabId.startsWith('file:')) {
      const filePath = tabId.replace('file:', '');
      setActiveFile(filePath);
    }
  };

  const handleTabClose = (panelId: string, tabId: string) => {
    setPanels(prev => prev.map(panel => {
      if (panel.id === panelId) {
        const newTabs = panel.tabs.filter(tab => tab.id !== tabId);
        const newActiveTabId = panel.activeTabId === tabId 
          ? newTabs[newTabs.length - 1]?.id 
          : panel.activeTabId;
        
        return {
          ...panel,
          tabs: newTabs,
          activeTabId: newActiveTabId
        };
      }
      return panel;
    }));

    // Remove from open files if it's a file tab
    if (tabId.startsWith('file:')) {
      const filePath = tabId.replace('file:', '');
      setOpenFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(filePath);
        return newMap;
      });
    }
  };

  const handleTabAdd = (panelId: string, type: TabType) => {
    const newTabId = `new-${type}-${Date.now()}`;
    const newTab: Tab = {
      id: newTabId,
      title: `New ${type}`,
      type,
      content: getTabContent(newTabId, type),
      isDirty: false
    };

    setPanels(prev => prev.map(panel => 
      panel.id === panelId 
        ? { 
            ...panel, 
            tabs: [...panel.tabs, newTab],
            activeTabId: newTabId
          }
        : panel
    ));
  };

  const handlePanelCollapse = (panelId: string, collapsed: boolean) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId ? { ...panel, isCollapsed: collapsed } : panel
    ));
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'hpp': 'cpp',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'md': 'markdown',
      'sh': 'shell',
      'bash': 'shell',
      'yml': 'yaml',
      'yaml': 'yaml'
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  return (
    <div className={className}>
      <WorkspaceInterface
        panels={panels}
        onPanelResize={handlePanelResize}
        onTabChange={handleTabChange}
        onTabClose={handleTabClose}
        onTabAdd={handleTabAdd}
        onPanelCollapse={handlePanelCollapse}
        orientation="horizontal"
      />
    </div>
  );
}
