'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useWorkspaceContext } from '@/hooks/use-workspace-context';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { TabSystem, TabItem } from './tab-system';
import { CodeEditor } from './monaco-editor';
import { Terminal } from './terminal';
import { FileExplorer } from './file-explorer';
import { AIAssistant } from './ai-assistant';
import { AdvancedChatInterface } from '@/components/ai/advanced-chat-interface';
import { AIWorkspacePanel } from '@/components/ai/ai-workspace-panel';
import { WorkspaceManager } from './workspace-manager';
import { NetworkingConfig } from './networking-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Terminal as TerminalIcon, 
  Folder, 
  Bot, 
  Settings,
  Globe,
  Code,
  Plus,
  Layout,
  Maximize2,
  Minimize2,
  RotateCcw,
  Network
} from 'lucide-react';
import type { DevSandbox } from '../core/dev-sandbox';
import type { FileInfo, NetworkingConfig as NetworkingConfigType } from '../types';

interface WorkspaceLayoutV2Props {
  sandbox: DevSandbox | null;
  className?: string;
  onFileOpen?: (file: FileInfo) => void;
  onFileChange?: (path: string, content: string) => void;
  networkingConfig?: NetworkingConfigType;
  onNetworkingChange?: (config: NetworkingConfigType) => void;
  enableAIChat?: boolean;
}

interface OpenFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export function WorkspaceLayoutV2({
  sandbox,
  className,
  onFileOpen,
  onFileChange,
  networkingConfig,
  onNetworkingChange,
  enableAIChat = false
}: WorkspaceLayoutV2Props) {
  // Workspace context for AI integration
  const workspaceContext = useWorkspaceContext({
    autoSnapshot: true,
    trackFileChanges: true,
    trackTerminalHistory: true
  });

  // Sidebar tabs
  const [sidebarTabs, setSidebarTabs] = useState<TabItem[]>([
    {
      id: 'file-explorer',
      title: 'Explorer',
      type: 'file',
      icon: <Folder className="h-3 w-3" />,
      content: <div />, // Will be populated
      canClose: false
    },
    {
      id: 'workspace-manager',
      title: 'Projects',
      type: 'file',
      icon: <Layout className="h-3 w-3" />,
      content: <div />, // Will be populated
      canClose: false
    },
    {
      id: 'networking-config',
      title: 'Network',
      type: 'settings',
      icon: <Network className="h-3 w-3" />,
      content: <div />, // Will be populated
      canClose: false
    }
  ]);

  // Main editor tabs
  const [editorTabs, setEditorTabs] = useState<TabItem[]>([
    {
      id: 'welcome',
      title: 'Welcome',
      type: 'file',
      icon: <Code className="h-3 w-3" />,
      content: <div />, // Will be populated
      canClose: false
    }
  ]);

  // Bottom panel tabs
  const [bottomTabs, setBottomTabs] = useState<TabItem[]>([
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
  ]);

  const [activeSidebarTab, setActiveSidebarTab] = useState('file-explorer');
  const [activeEditorTab, setActiveEditorTab] = useState('welcome');
  const [activeBottomTab, setActiveBottomTab] = useState('terminal-1');
  const [openFiles, setOpenFiles] = useState<Map<string, OpenFile>>(new Map());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);

  // Update tab contents when dependencies change
  useEffect(() => {
    updateTabContents();
  }, [sandbox, openFiles, networkingConfig]);

  const updateTabContents = () => {
    // Update sidebar tabs
    setSidebarTabs(prev => prev.map(tab => ({
      ...tab,
      content: getSidebarTabContent(tab.id)
    })));

    // Update editor tabs
    setEditorTabs(prev => prev.map(tab => ({
      ...tab,
      content: getEditorTabContent(tab.id)
    })));

    // Update bottom tabs
    setBottomTabs(prev => prev.map(tab => ({
      ...tab,
      content: getBottomTabContent(tab.id)
    })));
  };

  const getSidebarTabContent = (tabId: string): React.ReactNode => {
    switch (tabId) {
      case 'file-explorer':
        if (!sandbox) {
          return (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center space-y-3">
                <Folder className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">File Explorer</p>
                  <p className="text-xs text-muted-foreground">
                    Sandbox not initialized. Start a WebVM instance to browse files.
                  </p>
                </div>
              </div>
            </div>
          );
        }
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
        return <div className="p-4 text-muted-foreground">Content not available</div>;
    }
  };

  const getEditorTabContent = (tabId: string): React.ReactNode => {
    if (tabId === 'welcome') {
      return (
        <Card className="h-full border-0 rounded-none">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center space-y-6 max-w-md">
              <div className="space-y-2">
                <Code className="h-16 w-16 mx-auto text-primary" />
                <h2 className="text-2xl font-bold">Welcome to WebVM Workspace</h2>
                <p className="text-muted-foreground">
                  A complete development environment running in your browser
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h3 className="font-semibold">Quick Start</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Open files from Explorer</li>
                    <li>• Create new projects</li>
                    <li>• Use AI assistance</li>
                    <li>• Run terminal commands</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Features</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Full Linux environment</li>
                    <li>• Multiple languages</li>
                    <li>• Network connectivity</li>
                    <li>• Persistent storage</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={() => handleNewFile()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New File
                </Button>
                <Button variant="outline" onClick={() => setActiveSidebarTab('workspace-manager')}>
                  <Layout className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Handle file editor tabs
    if (tabId.startsWith('file:')) {
      const filePath = tabId.replace('file:', '');
      const file = openFiles.get(filePath);
      
      if (file) {
        return (
          <CodeEditor
            sandbox={sandbox}
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
  };

  const getBottomTabContent = (tabId: string): React.ReactNode => {
    switch (tabId) {
      case 'terminal-1':
        if (!sandbox) {
          return (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center space-y-3">
                <TerminalIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Terminal</p>
                  <p className="text-xs text-muted-foreground">
                    Sandbox not initialized. Start a WebVM instance to use the terminal.
                  </p>
                </div>
              </div>
            </div>
          );
        }
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
        if (!sandbox) {
          return (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center space-y-3">
                <Bot className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">AI Assistant</p>
                  <p className="text-xs text-muted-foreground">
                    Sandbox not initialized. Start a WebVM instance to enable AI assistance.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        // Use advanced AI workspace panel if enabled
        if (enableAIChat) {
          return (
            <AIWorkspacePanel
              sandbox={sandbox}
              className="h-full"
            />
          );
        }

        // Fallback to original AI assistant
        return (
          <AIAssistant
            sandbox={sandbox}
            className="h-full"
            onMessage={(message) => {
              console.log('AI message:', message);
            }}
          />
        );

      default:
        return <div className="p-4 text-muted-foreground">Content not available</div>;
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
        
        // Add tab to editor
        const fileTabId = `file:${file.path}`;
        setEditorTabs(prev => {
          const existingTab = prev.find(tab => tab.id === fileTabId);
          if (!existingTab) {
            return [...prev, {
              id: fileTabId,
              title: file.name,
              type: 'file' as const,
              icon: <FileText className="h-3 w-3" />,
              content: getEditorTabContent(fileTabId),
              isDirty: false,
              path: file.path
            }];
          }
          return prev;
        });

        setActiveEditorTab(fileTabId);
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
        setEditorTabs(prev => prev.filter(tab => tab.id !== fileTabId));
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
    setEditorTabs(prev => prev.map(tab => 
      tab.path === path ? { ...tab, isDirty: true } : tab
    ));

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

        setEditorTabs(prev => prev.map(tab => 
          tab.path === path ? { ...tab, isDirty: false } : tab
        ));
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  };

  const handleNewFile = () => {
    const newFileId = `new-file-${Date.now()}`;
    const newTab: TabItem = {
      id: newFileId,
      title: 'Untitled',
      type: 'file',
      icon: <FileText className="h-3 w-3" />,
      content: (
        <CodeEditor
          sandbox={sandbox}
          value=""
          language="plaintext"
          onChange={(value) => console.log('New file content:', value)}
          className="h-full"
        />
      ),
      isDirty: false
    };

    setEditorTabs(prev => [...prev, newTab]);
    setActiveEditorTab(newFileId);
  };

  const handleTabClose = (tabId: string, tabType: 'sidebar' | 'editor' | 'bottom') => {
    switch (tabType) {
      case 'editor':
        setEditorTabs(prev => prev.filter(tab => tab.id !== tabId));
        if (tabId.startsWith('file:')) {
          const filePath = tabId.replace('file:', '');
          setOpenFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(filePath);
            return newMap;
          });
        }
        break;
      case 'bottom':
        setBottomTabs(prev => prev.filter(tab => tab.id !== tabId));
        break;
    }
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
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <TabSystem
                tabs={sidebarTabs}
                activeTabId={activeSidebarTab}
                onTabChange={setActiveSidebarTab}
                showAddButton={false}
                className="h-full"
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Content Area */}
        <ResizablePanel defaultSize={sidebarCollapsed ? 80 : 60}>
          <ResizablePanelGroup direction="vertical">
            {/* Editor */}
            <ResizablePanel defaultSize={bottomCollapsed ? 100 : 70} minSize={30}>
              <TabSystem
                tabs={editorTabs}
                activeTabId={activeEditorTab}
                onTabChange={setActiveEditorTab}
                onTabClose={(tabId) => handleTabClose(tabId, 'editor')}
                onTabAdd={handleNewFile}
                onTabSave={handleFileSave}
                className="h-full"
              />
            </ResizablePanel>

            {/* Bottom Panel */}
            {!bottomCollapsed && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={20}>
                  <TabSystem
                    tabs={bottomTabs}
                    activeTabId={activeBottomTab}
                    onTabChange={setActiveBottomTab}
                    onTabClose={(tabId) => handleTabClose(tabId, 'bottom')}
                    showAddButton={false}
                    className="h-full"
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
