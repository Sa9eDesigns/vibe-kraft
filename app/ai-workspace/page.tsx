'use client';

import React, { useState, useCallback } from 'react';
import { AIWorkspacePanel } from '@/components/ai/ai-workspace-panel';
import { AdvancedChatInterface } from '@/components/ai/advanced-chat-interface';
import { AgentWorkflowPanel } from '@/components/ai/agent-workflow-panel';
import { ToolExecutionVisualizer } from '@/components/ai/tool-execution-visualizer';
import { useWorkspaceContext } from '@/hooks/use-workspace-context';
import { useConversationManager } from '@/hooks/use-conversation-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { 
  Bot, 
  Sparkles, 
  Workflow, 
  Terminal, 
  MessageSquare,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  Zap,
  Brain,
  Code,
  GitBranch,
  Server,
  TestTube
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AIWorkspacePage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDemo, setActiveDemo] = useState<'integrated' | 'chat' | 'workflows' | 'tools'>('integrated');
  const [toolExecutions, setToolExecutions] = useState<any[]>([]);

  // Initialize workspace context and conversation management
  const workspaceContext = useWorkspaceContext({
    autoSnapshot: true,
    trackFileChanges: true,
    trackTerminalHistory: true
  });

  const conversationManager = useConversationManager({
    autoSave: true,
    maxRecentConversations: 10
  });

  // Demo data for tool executions
  const demoToolExecutions = [
    {
      id: 'exec_1',
      name: 'bash',
      parameters: { command: 'npm install react @types/react' },
      status: 'completed' as const,
      result: 'Successfully installed packages',
      startTime: new Date(Date.now() - 30000),
      endTime: new Date(Date.now() - 25000),
      duration: 5000,
      progress: 100
    },
    {
      id: 'exec_2',
      name: 'writeFile',
      parameters: { 
        path: '/src/components/Button.tsx',
        content: 'import React from "react";\n\nexport const Button = () => {\n  return <button>Click me</button>;\n};'
      },
      status: 'completed' as const,
      result: 'File created successfully',
      startTime: new Date(Date.now() - 20000),
      endTime: new Date(Date.now() - 18000),
      duration: 2000,
      progress: 100
    },
    {
      id: 'exec_3',
      name: 'generateCode',
      parameters: { 
        prompt: 'Create a React component for user authentication',
        language: 'typescript'
      },
      status: 'running' as const,
      startTime: new Date(Date.now() - 5000),
      progress: 65,
      logs: [
        'Analyzing requirements...',
        'Generating component structure...',
        'Adding TypeScript types...',
        'Implementing authentication logic...'
      ]
    }
  ];

  const handleToolExecution = useCallback((tool: string, params: any, result: any) => {
    console.log('Tool executed:', { tool, params, result });
    
    // Update workspace context
    if (tool === 'bash' && params.command) {
      workspaceContext.addTerminalCommand(params.command);
    }
    
    if (tool === 'writeFile' && params.path && params.content) {
      workspaceContext.updateFile({
        path: params.path,
        content: params.content,
        language: 'typescript',
        lastModified: new Date(),
        size: params.content.length,
        isDirectory: false
      });
    }
    
    toast.success(`Tool ${tool} executed successfully`);
  }, [workspaceContext]);

  const handleWorkflowStart = useCallback((workflow: any) => {
    console.log('Starting workflow:', workflow);
    toast.success(`Started ${workflow.name} workflow`);
  }, []);

  const renderDemoStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-lg font-semibold">{conversationManager.conversations.length}</div>
              <div className="text-xs text-muted-foreground">Conversations</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-500" />
            <div>
              <div className="text-lg font-semibold">{workspaceContext.state.terminalHistory.length}</div>
              <div className="text-xs text-muted-foreground">Commands</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-500" />
            <div>
              <div className="text-lg font-semibold">{workspaceContext.state.openFiles.length}</div>
              <div className="text-xs text-muted-foreground">Open Files</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-orange-500" />
            <div>
              <div className="text-lg font-semibold">3</div>
              <div className="text-xs text-muted-foreground">Active Workflows</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegratedDemo = () => (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={70} minSize={50}>
        <div className="h-full p-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI-Powered Development Environment
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0">
              <div className="h-full bg-muted/30 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Code className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">WebVM Development Environment</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      This would be your actual WebVM workspace with code editor, terminal, and file explorer.
                      The AI assistant integrates seamlessly with all workspace components.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Badge variant="outline">Monaco Editor</Badge>
                    <Badge variant="outline">Terminal</Badge>
                    <Badge variant="outline">File Explorer</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ResizablePanel>
      
      <ResizableHandle />
      
      <ResizablePanel defaultSize={30} minSize={25}>
        <div className="h-full p-4">
          <AIWorkspacePanel
            className="h-full"
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
    <div className={cn(
      "min-h-screen bg-background",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">AI-Powered Remote Workspace</h1>
              </div>
              <Badge variant="secondary" className="text-xs">
                Powered by AI SDK
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={activeDemo === 'integrated' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveDemo('integrated')}
              >
                <Zap className="w-4 h-4 mr-1" />
                Integrated
              </Button>
              <Button
                variant={activeDemo === 'chat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveDemo('chat')}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Chat
              </Button>
              <Button
                variant={activeDemo === 'workflows' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveDemo('workflows')}
              >
                <Workflow className="w-4 h-4 mr-1" />
                Workflows
              </Button>
              <Button
                variant={activeDemo === 'tools' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveDemo('tools')}
              >
                <Terminal className="w-4 h-4 mr-1" />
                Tools
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {renderDemoStats()}
        
        <div className="h-[calc(100vh-200px)]">
          {activeDemo === 'integrated' && renderIntegratedDemo()}
          
          {activeDemo === 'chat' && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Advanced AI Chat Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <AdvancedChatInterface
                  className="h-full"
                  workspaceContext={workspaceContext.aiContext}
                  onToolExecution={handleToolExecution}
                  onContextUpdate={(context) => console.log('Context updated:', context)}
                />
              </CardContent>
            </Card>
          )}
          
          {activeDemo === 'workflows' && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  AI Agent Workflows
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <AgentWorkflowPanel
                  workspaceContext={workspaceContext.aiContext}
                  onWorkflowStart={handleWorkflowStart}
                  onWorkflowPause={(id) => console.log('Pause workflow:', id)}
                  onWorkflowStop={(id) => console.log('Stop workflow:', id)}
                  onWorkflowResume={(id) => console.log('Resume workflow:', id)}
                />
              </CardContent>
            </Card>
          )}
          
          {activeDemo === 'tools' && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Tool Execution Visualizer
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <ToolExecutionVisualizer
                  executions={demoToolExecutions}
                  onRetry={(execution) => console.log('Retry:', execution)}
                  onCancel={(execution) => console.log('Cancel:', execution)}
                  onClear={(id) => console.log('Clear:', id)}
                  onClearAll={() => console.log('Clear all')}
                  showLogs={true}
                  autoScroll={true}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
