'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { TabSystem, TabItem } from '@/components/webvm/ui/tab-system';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Terminal as TerminalIcon, 
  Folder, 
  Package,
  Settings,
  Code,
  Plus,
  Layout,
  Python,
  Play,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PyodideTerminal } from './pyodide-terminal';
import { PyodideFileExplorer } from './pyodide-file-explorer';
import { PyodidePackageManager } from './pyodide-package-manager';
import { SeedProjectSelector } from '../seed-projects/seed-project-selector';
import { SeedProjectLoader } from '../seed-projects/seed-project-loader';
import { SeedProject } from '../seed-projects/seed-project-templates';
import { usePyodide } from '../hooks/use-pyodide';
import { FileInfo } from '../core/pyodide-filesystem';

interface PyodideWorkspaceLayoutProps {
  workspaceId: string;
  className?: string;
  onFileOpen?: (file: FileInfo) => void;
  onFileChange?: (path: string, content: string) => void;
}

interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
  modified: boolean;
}

export function PyodideWorkspaceLayout({
  workspaceId,
  className,
  onFileOpen,
  onFileChange
}: PyodideWorkspaceLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('files');
  const [activeEditorTab, setActiveEditorTab] = useState('welcome');
  const [activeBottomTab, setActiveBottomTab] = useState('terminal');
  const [openFiles, setOpenFiles] = useState<Map<string, OpenFile>>(new Map());
  const [showSeedProjects, setShowSeedProjects] = useState(false);
  const [projectLoader, setProjectLoader] = useState<SeedProjectLoader | null>(null);

  const {
    isInitialized,
    isLoading,
    error,
    runPython,
    readFile,
    writeFile,
    createFile,
    fileSystem,
    packageManager
  } = usePyodide({ workspaceId });

  // Initialize project loader when file system is ready
  React.useEffect(() => {
    if (fileSystem && packageManager && !projectLoader) {
      setProjectLoader(new SeedProjectLoader(fileSystem, packageManager));
    }
  }, [fileSystem, packageManager, projectLoader]);

  // Check if workspace is empty and show seed projects
  React.useEffect(() => {
    const checkWorkspaceEmpty = async () => {
      if (isInitialized && fileSystem) {
        try {
          const files = await fileSystem.listDirectory();
          const hasFiles = files.some(file =>
            file.type === 'file' && !file.name.startsWith('.')
          );
          setShowSeedProjects(!hasFiles);
        } catch (error) {
          console.error('Failed to check workspace files:', error);
        }
      }
    };

    checkWorkspaceEmpty();
  }, [isInitialized, fileSystem]);

  // Sidebar tabs
  const sidebarTabs: TabItem[] = [
    {
      id: 'files',
      title: 'Files',
      icon: <Folder className="h-4 w-4" />,
      content: <div />, // Will be populated
      canClose: false,
    },
    {
      id: 'packages',
      title: 'Packages',
      icon: <Package className="h-4 w-4" />,
      content: <div />, // Will be populated
      canClose: false,
    },
  ];

  // Editor tabs
  const editorTabs: TabItem[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      icon: <Python className="h-4 w-4" />,
      content: <div />, // Will be populated
      canClose: false,
    },
    ...Array.from(openFiles.values()).map(file => ({
      id: `file:${file.path}`,
      title: file.name + (file.modified ? ' •' : ''),
      icon: <FileText className="h-4 w-4" />,
      content: <div />, // Will be populated
      canClose: true,
    })),
  ];

  // Bottom tabs
  const bottomTabs: TabItem[] = [
    {
      id: 'terminal',
      title: 'Terminal',
      icon: <TerminalIcon className="h-4 w-4" />,
      content: <div />, // Will be populated
      canClose: false,
    },
  ];

  // Handle file opening
  const handleFileOpen = useCallback(async (file: FileInfo) => {
    if (file.type === 'directory') return;

    try {
      const content = await readFile(file.path);
      const language = getLanguageFromExtension(file.name);
      
      const openFile: OpenFile = {
        path: file.path,
        name: file.name,
        content,
        language,
        modified: false
      };

      setOpenFiles(prev => new Map(prev.set(file.path, openFile)));
      setActiveEditorTab(`file:${file.path}`);
      onFileOpen?.(file);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, [readFile, onFileOpen]);

  // Handle file content change
  const handleFileContentChange = useCallback((path: string, content: string) => {
    setOpenFiles(prev => {
      const file = prev.get(path);
      if (file) {
        const updatedFile = { ...file, content, modified: true };
        return new Map(prev.set(path, updatedFile));
      }
      return prev;
    });
    onFileChange?.(path, content);
  }, [onFileChange]);

  // Handle file save
  const handleFileSave = useCallback(async (path: string) => {
    const file = openFiles.get(path);
    if (!file) return;

    try {
      await writeFile(path, file.content);
      setOpenFiles(prev => {
        const updatedFile = { ...file, modified: false };
        return new Map(prev.set(path, updatedFile));
      });
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [openFiles, writeFile]);

  // Handle tab close
  const handleTabClose = useCallback((tabId: string) => {
    if (tabId.startsWith('file:')) {
      const path = tabId.replace('file:', '');
      setOpenFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(path);
        return newMap;
      });
      
      // Switch to welcome tab if closing active tab
      if (activeEditorTab === tabId) {
        setActiveEditorTab('welcome');
      }
    }
  }, [activeEditorTab]);

  // Handle seed project selection
  const handleSeedProjectSelect = useCallback(async (project: SeedProject) => {
    if (!projectLoader) return;

    try {
      console.log('Loading seed project:', project.name);
      const result = await projectLoader.loadProject(project, {
        overwriteExisting: true,
        installPackages: true,
        createReadme: true
      });

      if (result.success) {
        console.log('Seed project loaded successfully');
        setShowSeedProjects(false);

        // Open the main file if it exists
        const mainFile = project.files.find(f =>
          f.path.includes('main.py') || f.path.endsWith('.py')
        );

        if (mainFile) {
          const openFile: OpenFile = {
            path: mainFile.path,
            name: mainFile.path.split('/').pop() || mainFile.path,
            content: mainFile.content,
            language: 'python',
            modified: false
          };

          setOpenFiles(prev => new Map(prev.set(mainFile.path, openFile)));
          setActiveEditorTab(`file:${mainFile.path}`);
        }
      } else {
        console.error('Failed to load seed project:', result.errors);
      }
    } catch (error) {
      console.error('Error loading seed project:', error);
    }
  }, [projectLoader]);

  // Handle new file creation
  const handleNewFile = useCallback(async () => {
    const fileName = `untitled-${Date.now()}.py`;
    const content = '# New Python file\nprint("Hello, World!")\n';

    try {
      await createFile(fileName, content);

      const openFile: OpenFile = {
        path: fileName,
        name: fileName,
        content,
        language: 'python',
        modified: false
      };

      setOpenFiles(prev => new Map(prev.set(fileName, openFile)));
      setActiveEditorTab(`file:${fileName}`);
      setShowSeedProjects(false); // Hide seed projects when creating files
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  }, [createFile]);

  // Get language from file extension
  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py': return 'python';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'txt': return 'plaintext';
      default: return 'plaintext';
    }
  };

  // Get sidebar tab content
  const getSidebarTabContent = (tabId: string): React.ReactNode => {
    switch (tabId) {
      case 'files':
        return (
          <PyodideFileExplorer
            workspaceId={workspaceId}
            onFileOpen={handleFileOpen}
            className="h-full"
          />
        );
      case 'packages':
        return (
          <PyodidePackageManager
            workspaceId={workspaceId}
            className="h-full"
          />
        );
      default:
        return <div>Tab content not found</div>;
    }
  };

  // Get editor tab content
  const getEditorTabContent = (tabId: string): React.ReactNode => {
    if (tabId === 'welcome') {
      if (showSeedProjects) {
        return (
          <div className="h-full p-6 overflow-auto">
            <SeedProjectSelector
              onProjectSelect={handleSeedProjectSelect}
              className="max-w-6xl mx-auto"
            />
          </div>
        );
      }

      return (
        <Card className="h-full">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Python className="h-16 w-16 mx-auto text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Welcome to Python Workspace</h3>
                <p className="text-muted-foreground">
                  Create Python files and run code in the browser
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleNewFile}>
                  <Plus className="h-4 w-4 mr-2" />
                  New File
                </Button>
                <Button variant="outline" onClick={() => setShowSeedProjects(true)}>
                  <Code className="h-4 w-4 mr-2" />
                  Seed Projects
                </Button>
                <Button variant="outline" onClick={() => setActiveSidebarTab('files')}>
                  <Folder className="h-4 w-4 mr-2" />
                  Open Files
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• Python 3.11 runtime powered by Pyodide</div>
                <div>• Install packages with micropip</div>
                <div>• Files are saved in browser storage</div>
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
          <div className="h-full flex flex-col">
            {/* File Editor Header */}
            <div className="flex items-center justify-between p-2 border-b bg-muted/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
                {file.modified && (
                  <Badge variant="secondary" className="text-xs">
                    Modified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileSave(file.path)}
                  disabled={!file.modified}
                  className="h-7 px-2 text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => runPython(file.content)}
                  className="h-7 px-2 text-xs"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </Button>
              </div>
            </div>

            {/* Simple Code Editor */}
            <div className="flex-1 p-4">
              <textarea
                value={file.content}
                onChange={(e) => handleFileContentChange(file.path, e.target.value)}
                className="w-full h-full font-mono text-sm bg-background border rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Write your Python code here..."
                spellCheck={false}
              />
            </div>
          </div>
        );
      }
    }

    return <div>Content not found</div>;
  };

  // Get bottom tab content
  const getBottomTabContent = (tabId: string): React.ReactNode => {
    switch (tabId) {
      case 'terminal':
        return (
          <PyodideTerminal
            workspaceId={workspaceId}
            className="h-full"
          />
        );
      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className={cn('h-full flex flex-col bg-background', className)}>
      {/* Workspace Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Python className="h-5 w-5 text-blue-500" />
          <span className="font-semibold">Python Workspace</span>
          {isLoading && (
            <Badge variant="secondary" className="text-xs">
              Loading...
            </Badge>
          )}
          {isInitialized && (
            <Badge variant="default" className="text-xs">
              Ready
            </Badge>
          )}
          {error && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-7 w-7 p-0"
          >
            <Layout className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                <TabSystem
                  tabs={sidebarTabs}
                  activeTabId={activeSidebarTab}
                  onTabChange={setActiveSidebarTab}
                  orientation="vertical"
                  className="h-full"
                >
                  {getSidebarTabContent(activeSidebarTab)}
                </TabSystem>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Main Content Area */}
          <ResizablePanel defaultSize={sidebarCollapsed ? 100 : 75}>
            <ResizablePanelGroup direction="vertical">
              {/* Editor */}
              <ResizablePanel defaultSize={bottomCollapsed ? 100 : 70} minSize={30}>
                <TabSystem
                  tabs={editorTabs}
                  activeTabId={activeEditorTab}
                  onTabChange={setActiveEditorTab}
                  onTabClose={handleTabClose}
                  className="h-full"
                >
                  {getEditorTabContent(activeEditorTab)}
                </TabSystem>
              </ResizablePanel>

              {/* Bottom Panel */}
              {!bottomCollapsed && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={30} minSize={20}>
                    <TabSystem
                      tabs={bottomTabs}
                      activeTabId={activeBottomTab}
                      onTabChange={setActiveBottomTab}
                      className="h-full"
                    >
                      {getBottomTabContent(activeBottomTab)}
                    </TabSystem>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
