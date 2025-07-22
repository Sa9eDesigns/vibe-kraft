'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AdvancedChatInterface } from './advanced-chat-interface';
import { AgentWorkflowPanel } from './agent-workflow-panel';
import { useWorkspaceContext } from '@/hooks/use-workspace-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  MessageSquare, 
  History, 
  FileText, 
  Terminal, 
  Settings,
  Workflow,
  Brain,
  Zap,
  Clock,
  Activity,
  Code,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DevSandbox } from '@/components/webvm/core/dev-sandbox';

interface AIWorkspacePanelProps {
  sandbox?: DevSandbox | null;
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function AIWorkspacePanel({ 
  sandbox, 
  className,
  isFullscreen = false,
  onToggleFullscreen
}: AIWorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const [isExpanded, setIsExpanded] = useState(true);
  
  const workspaceContext = useWorkspaceContext({
    autoSnapshot: true,
    trackFileChanges: true,
    trackTerminalHistory: true
  });

  const handleToolExecution = useCallback((tool: string, params: any, result: any) => {
    console.log('Tool executed:', { tool, params, result });
    
    // Update workspace context based on tool execution
    switch (tool) {
      case 'bash':
        if (params.command) {
          workspaceContext.addTerminalCommand(params.command);
        }
        break;
        
      case 'writeFile':
        if (params.path && params.content) {
          workspaceContext.updateFile({
            path: params.path,
            content: params.content,
            language: params.language || 'text',
            lastModified: new Date(),
            size: params.content.length,
            isDirectory: false
          });
        }
        break;
        
      case 'readFile':
        if (params.path && result?.content) {
          workspaceContext.updateFile({
            path: params.path,
            content: result.content,
            language: params.language || 'text',
            lastModified: new Date(),
            size: result.content.length,
            isDirectory: false
          });
        }
        break;
    }
  }, [workspaceContext]);

  const handleContextUpdate = useCallback((context: any) => {
    console.log('Context updated:', context);
    // Additional context processing can be added here
  }, []);

  const renderContextSummary = () => {
    const { state, aiContext } = workspaceContext;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">{state.openFiles.length}</div>
                <div className="text-xs text-muted-foreground">Open Files</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">{state.terminalHistory.length}</div>
                <div className="text-xs text-muted-foreground">Commands</div>
              </div>
            </div>
          </Card>
        </div>

        {state.projectContext && (
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Project Context</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span>{state.projectContext.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="text-xs">
                  {state.projectContext.type}
                </Badge>
              </div>
              {state.projectContext.framework && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Framework:</span>
                  <span>{state.projectContext.framework}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {state.gitStatus && (
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Git Status</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch:</span>
                <span>{state.gitStatus.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Changes:</span>
                <Badge variant={state.gitStatus.hasChanges ? "destructive" : "secondary"} className="text-xs">
                  {state.gitStatus.hasChanges ? 'Modified' : 'Clean'}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {state.errors.length > 0 && (
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Recent Errors</span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {state.errors.slice(-5).map((error, index) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded">
                    <div className="font-medium">{error.file}:{error.line}</div>
                    <div className="text-muted-foreground">{error.message}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    );
  };

  const renderActivityHistory = () => {
    const { snapshots } = workspaceContext;
    
    return (
      <div className="space-y-2">
        <ScrollArea className="h-64">
          {snapshots.slice(-10).map((snapshot, index) => (
            <div key={index} className="p-3 border rounded mb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {snapshot.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Snapshot
                </Badge>
              </div>
              {snapshot.userIntent && (
                <div className="text-xs mb-1">
                  <span className="text-muted-foreground">Intent:</span> {snapshot.userIntent}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {snapshot.state.openFiles.length} files, {snapshot.state.terminalHistory.length} commands
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    );
  };

  if (!isExpanded) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="w-full justify-start"
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      isFullscreen && "fixed inset-0 z-50",
      className
    )}>
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Workspace</h3>
        </div>
        <div className="flex items-center gap-1">
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 m-2">
          <TabsTrigger value="chat" className="text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs">
            <Workflow className="w-3 h-3 mr-1" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="context" className="text-xs">
            <Activity className="w-3 h-3 mr-1" />
            Context
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <History className="w-3 h-3 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 m-0">
          <AdvancedChatInterface
            className="h-full"
            workspaceContext={workspaceContext.aiContext}
            onToolExecution={handleToolExecution}
            onContextUpdate={handleContextUpdate}
            isFullscreen={isFullscreen}
            onToggleFullscreen={onToggleFullscreen}
          />
        </TabsContent>

        <TabsContent value="workflows" className="flex-1 m-0 p-4">
          <ScrollArea className="h-full">
            <AgentWorkflowPanel
              workspaceContext={workspaceContext.aiContext}
              onWorkflowStart={(workflow) => {
                console.log('Starting workflow:', workflow);
                // TODO: Integrate with AI chat to execute workflow
              }}
              onWorkflowPause={(workflowId) => {
                console.log('Pausing workflow:', workflowId);
              }}
              onWorkflowStop={(workflowId) => {
                console.log('Stopping workflow:', workflowId);
              }}
              onWorkflowResume={(workflowId) => {
                console.log('Resuming workflow:', workflowId);
              }}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="context" className="flex-1 m-0 p-4">
          <ScrollArea className="h-full">
            {renderContextSummary()}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0 p-4">
          {renderActivityHistory()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
