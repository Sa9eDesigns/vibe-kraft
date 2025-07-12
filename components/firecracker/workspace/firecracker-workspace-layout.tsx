'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { WorkspaceInterface, Tab, Panel, TabType } from '@/components/webvm/ui/workspace-interface';
import { FirecrackerCodeEditor } from './firecracker-code-editor';
import { FirecrackerTerminal } from './firecracker-terminal';
import { FirecrackerFileExplorer } from './firecracker-file-explorer';
import { FirecrackerAIAssistant } from './firecracker-ai-assistant';
import { FirecrackerContainerManager } from './firecracker-container-manager';
import { FirecrackerVMMonitor } from './firecracker-vm-monitor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Terminal as TerminalIcon, 
  Folder, 
  Bot, 
  Settings,
  Container,
  Monitor,
  Code,
  Plus,
  Layout,
  Activity,
  Server,
  Play,
  Square,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirecrackerWorkspace, FirecrackerVMStatus } from '@/lib/types/firecracker';

interface FirecrackerWorkspaceLayoutProps {
  workspace: FirecrackerWorkspace;
  className?: string;
  onWorkspaceUpdate?: (workspace: FirecrackerWorkspace) => void;
}

export function FirecrackerWorkspaceLayout({
  workspace,
  className,
  onWorkspaceUpdate
}: FirecrackerWorkspaceLayoutProps) {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [activeTabIds, setActiveTabIds] = useState<Record<string, string>>({});
  const [vmStatus, setVMStatus] = useState<FirecrackerVMStatus>(workspace.vm);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize panels
  useEffect(() => {
    const initialPanels: Panel[] = [
      {
        id: 'sidebar',
        title: 'Explorer',
        size: 20,
        minSize: 15,
        maxSize: 40,
        tabs: [
          {
            id: 'file-explorer',
            title: 'Files',
            type: 'browser' as TabType,
            content: <FirecrackerFileExplorer workspace={workspace} />,
            icon: <Folder className="h-4 w-4" />,
            canClose: false,
          },
          {
            id: 'container-manager',
            title: 'Containers',
            type: 'settings' as TabType,
            content: <FirecrackerContainerManager workspace={workspace} />,
            icon: <Container className="h-4 w-4" />,
            canClose: false,
          },
        ],
        activeTabId: 'file-explorer',
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
            type: 'editor' as TabType,
            content: <WelcomeTab workspace={workspace} vmStatus={vmStatus} onVMAction={handleVMAction} />,
            icon: <Code className="h-4 w-4" />,
            canClose: false,
          },
        ],
        activeTabId: 'welcome',
      },
      {
        id: 'bottom',
        title: 'Terminal',
        size: 30,
        minSize: 20,
        tabs: [
          {
            id: 'terminal',
            title: 'Terminal',
            type: 'terminal' as TabType,
            content: <FirecrackerTerminal workspace={workspace} vmStatus={vmStatus} />,
            icon: <TerminalIcon className="h-4 w-4" />,
            canClose: false,
          },
          {
            id: 'ai-assistant',
            title: 'AI Assistant',
            type: 'ai' as TabType,
            content: <FirecrackerAIAssistant workspace={workspace} />,
            icon: <Bot className="h-4 w-4" />,
            canClose: false,
          },
          {
            id: 'vm-monitor',
            title: 'VM Monitor',
            type: 'settings' as TabType,
            content: <FirecrackerVMMonitor workspace={workspace} vmStatus={vmStatus} />,
            icon: <Monitor className="h-4 w-4" />,
            canClose: false,
          },
        ],
        activeTabId: 'terminal',
      },
    ];

    setPanels(initialPanels);
    
    // Set initial active tabs
    const initialActiveTabIds: Record<string, string> = {};
    initialPanels.forEach(panel => {
      if (panel.activeTabId) {
        initialActiveTabIds[panel.id] = panel.activeTabId;
      }
    });
    setActiveTabIds(initialActiveTabIds);
  }, [workspace]);

  const handlePanelResize = useCallback((panelId: string, newSize: number) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId ? { ...panel, size: newSize } : panel
    ));
  }, []);

  const handleTabChange = useCallback((panelId: string, tabId: string) => {
    setActiveTabIds(prev => ({ ...prev, [panelId]: tabId }));
  }, []);

  const handleTabClose = useCallback((panelId: string, tabId: string) => {
    setPanels(prev => prev.map(panel => {
      if (panel.id === panelId) {
        const newTabs = panel.tabs.filter(tab => tab.id !== tabId);
        const newActiveTabId = panel.activeTabId === tabId 
          ? (newTabs.length > 0 ? newTabs[0].id : undefined)
          : panel.activeTabId;
        return { ...panel, tabs: newTabs, activeTabId: newActiveTabId };
      }
      return panel;
    }));
  }, []);

  const handleTabAdd = useCallback((panelId: string, type: TabType) => {
    const newTabId = `${type}-${Date.now()}`;
    let newTab: Tab;

    switch (type) {
      case 'editor':
        newTab = {
          id: newTabId,
          title: 'Untitled',
          type,
          content: <FirecrackerCodeEditor workspace={workspace} />,
          icon: <FileText className="h-4 w-4" />,
          canClose: true,
        };
        break;
      case 'terminal':
        newTab = {
          id: newTabId,
          title: 'Terminal',
          type,
          content: <FirecrackerTerminal workspace={workspace} vmStatus={vmStatus} />,
          icon: <TerminalIcon className="h-4 w-4" />,
          canClose: true,
        };
        break;
      default:
        return;
    }

    setPanels(prev => prev.map(panel => {
      if (panel.id === panelId) {
        return { 
          ...panel, 
          tabs: [...panel.tabs, newTab],
          activeTabId: newTabId
        };
      }
      return panel;
    }));

    setActiveTabIds(prev => ({ ...prev, [panelId]: newTabId }));
  }, [workspace, vmStatus]);

  async function handleVMAction(action: 'start' | 'stop' | 'restart' | 'pause' | 'resume') {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/firecracker/workspaces/${workspace.id}/vm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status) {
          setVMStatus(prev => ({ ...prev, status: result.status }));
        }
        // Refresh workspace data
        if (onWorkspaceUpdate) {
          // In a real implementation, you'd fetch the updated workspace
          onWorkspaceUpdate(workspace);
        }
      } else {
        console.error('VM action failed:', await response.text());
      }
    } catch (error) {
      console.error('Error performing VM action:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("h-screen flex flex-col bg-background", className)}>
      {/* Workspace Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">{workspace.name}</h1>
          </div>
          <Badge variant={vmStatus.status === 'RUNNING' ? 'default' : 'secondary'}>
            {vmStatus.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleVMAction(vmStatus.status === 'RUNNING' ? 'stop' : 'start')}
            disabled={isLoading}
          >
            {vmStatus.status === 'RUNNING' ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop VM
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start VM
              </>
            )}
          </Button>
          
          {vmStatus.status === 'RUNNING' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVMAction('pause')}
              disabled={isLoading}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Workspace Interface */}
      <div className="flex-1 overflow-hidden">
        <WorkspaceInterface
          panels={panels}
          onPanelResize={handlePanelResize}
          onTabChange={handleTabChange}
          onTabClose={handleTabClose}
          onTabAdd={handleTabAdd}
          orientation="vertical"
        />
      </div>
    </div>
  );
}

// Welcome tab component
function WelcomeTab({ 
  workspace, 
  vmStatus, 
  onVMAction 
}: { 
  workspace: FirecrackerWorkspace; 
  vmStatus: FirecrackerVMStatus;
  onVMAction: (action: 'start' | 'stop' | 'restart' | 'pause' | 'resume') => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Welcome to {workspace.name}</h2>
        <p className="text-muted-foreground">
          Firecracker-powered development workspace with container orchestration
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Server className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">VM Status</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={vmStatus.status === 'RUNNING' ? 'default' : 'secondary'}>
                  {vmStatus.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>VM ID:</span>
                <code className="text-sm">{vmStatus.id}</code>
              </div>
              {vmStatus.started_at && (
                <div className="flex justify-between">
                  <span>Started:</span>
                  <span className="text-sm">{vmStatus.started_at.toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Container className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Containers</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{workspace.containers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Running:</span>
                <span>{workspace.containers.filter(c => c.status === 'RUNNING').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Stopped:</span>
                <span>{workspace.containers.filter(c => c.status === 'STOPPED').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4">
        {vmStatus.status !== 'RUNNING' && (
          <Button onClick={() => onVMAction('start')}>
            <Play className="h-4 w-4 mr-2" />
            Start VM
          </Button>
        )}
        
        {vmStatus.status === 'RUNNING' && (
          <>
            <Button variant="outline" onClick={() => onVMAction('pause')}>
              <Pause className="h-4 w-4 mr-2" />
              Pause VM
            </Button>
            <Button variant="outline" onClick={() => onVMAction('stop')}>
              <Square className="h-4 w-4 mr-2" />
              Stop VM
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
