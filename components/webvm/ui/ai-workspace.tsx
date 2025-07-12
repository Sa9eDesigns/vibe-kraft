'use client';

import React, { useState, useCallback } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Send, 
  User, 
  Code, 
  Terminal, 
  FileText, 
  Settings,
  Play,
  Pause,
  Square,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Brain,
  Workflow
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIWorkspaceProps {
  className?: string;
  onToolExecution?: (tool: string, params: any, result: any) => void;
}

interface WorkflowStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  result?: any;
}

export function AIWorkspace({ className, onToolExecution }: AIWorkspaceProps) {
  const [selectedModel, setSelectedModel] = useState<'gpt-4o' | 'claude-3-5-sonnet-20241022' | 'gemini-1.5-pro'>('claude-3-5-sonnet-20241022');
  const [agentMode, setAgentMode] = useState<'chat' | 'development' | 'review' | 'devops' | 'testing'>('chat');
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
    data
  } = useChat({
    api: '/api/ai/chat',
    body: {
      model: selectedModel,
      agentMode,
      context: 'webvm-workspace'
    },
    onError: (error) => {
      console.error('AI Chat Error:', error);
    },
    onFinish: (message) => {
      // Handle tool executions and workflow updates
      handleMessageFinish(message);
    }
  });

  const handleMessageFinish = useCallback((message: any) => {
    // Extract tool calls from the message
    if (message.toolInvocations) {
      message.toolInvocations.forEach((invocation: any) => {
        if (onToolExecution) {
          onToolExecution(invocation.toolName, invocation.args, invocation.result);
        }
      });
    }

    // Update workflow steps if in agent mode
    if (agentMode !== 'chat' && data?.workflow) {
      setWorkflowSteps(data.workflow.steps || []);
    }
  }, [agentMode, data, onToolExecution]);

  const startWorkflow = useCallback(async (workflowType: string, params: any) => {
    setIsWorkflowRunning(true);
    setWorkflowSteps([]);

    try {
      // This would trigger a workflow-specific prompt
      const workflowPrompt = generateWorkflowPrompt(workflowType, params);
      
      // Submit the workflow prompt
      await handleSubmit({
        preventDefault: () => {},
        target: { value: workflowPrompt }
      } as any);
    } catch (error) {
      console.error('Workflow error:', error);
    } finally {
      setIsWorkflowRunning(false);
    }
  }, [handleSubmit]);

  const generateWorkflowPrompt = (workflowType: string, params: any): string => {
    switch (workflowType) {
      case 'create-app':
        return `Create a full-stack application with the following requirements:
        - Name: ${params.name}
        - Frontend: ${params.frontend}
        - Backend: ${params.backend}
        - Database: ${params.database}
        - Features: ${params.features.join(', ')}
        
        Please create a complete project structure, implement the core functionality, and set up the development environment.`;
      
      case 'debug-issue':
        return `Debug the following issue in the current workspace:
        - Description: ${params.description}
        - Error: ${params.error || 'Not specified'}
        - Files: ${params.files?.join(', ') || 'Not specified'}
        
        Please analyze the issue, identify the root cause, and implement a fix.`;
      
      case 'code-review':
        return `Perform a comprehensive code review of the current project:
        - Focus areas: ${params.focusAreas?.join(', ') || 'general review'}
        - Severity level: ${params.severity || 'medium'}
        
        Please analyze the code quality, identify issues, and provide improvement suggestions.`;
      
      default:
        return params.prompt || 'Please help me with my development task.';
    }
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    
    if (isSystem) return null;

    return (
      <div key={index} className={cn(
        "flex gap-3 p-4",
        isUser ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "flex gap-3 max-w-[80%]",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          
          <div className={cn(
            "rounded-lg p-3 space-y-2",
            isUser 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted"
          )}>
            <div className="text-sm whitespace-pre-wrap">
              {message.content}
            </div>
            
            {/* Render tool invocations */}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="space-y-2 mt-3">
                {message.toolInvocations.map((invocation: any, idx: number) => (
                  <div key={idx} className="bg-background/50 rounded p-2 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Terminal className="w-3 h-3" />
                      <span className="font-medium">{invocation.toolName}</span>
                      <Badge variant="outline" className="text-xs">
                        {invocation.state || 'executed'}
                      </Badge>
                    </div>
                    {invocation.args && (
                      <pre className="text-xs opacity-70 overflow-x-auto">
                        {JSON.stringify(invocation.args, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWorkflowSteps = () => {
    if (workflowSteps.length === 0) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Workflow className="w-4 h-4" />
            Workflow Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {step.status === 'running' && <Clock className="w-4 h-4 text-blue-500 animate-spin" />}
                  {step.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  {step.status === 'pending' && <Clock className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                <Badge variant={
                  step.status === 'completed' ? 'default' :
                  step.status === 'running' ? 'secondary' :
                  step.status === 'error' ? 'destructive' : 'outline'
                }>
                  {step.status}
                </Badge>
              </div>
              {step.status === 'running' && (
                <Progress value={step.progress} className="h-1" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Workspace
          </h2>
          <div className="flex items-center gap-2">
            {isLoading && (
              <Button size="sm" variant="outline" onClick={stop}>
                <Square className="w-3 h-3 mr-1" />
                Stop
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={reload}>
              <Zap className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium">Model</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Agent Mode</label>
            <Select value={agentMode} onValueChange={setAgentMode}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">Chat Assistant</SelectItem>
                <SelectItem value="development">Development Agent</SelectItem>
                <SelectItem value="review">Code Review Agent</SelectItem>
                <SelectItem value="devops">DevOps Agent</SelectItem>
                <SelectItem value="testing">Testing Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="workflow">Workflows</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
            {/* Workflow Steps */}
            {renderWorkflowSteps()}

            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4">
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">
                          AI is thinking...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={`Ask the ${agentMode} agent anything...`}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="flex-1 p-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Quick Workflows</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => startWorkflow('create-app', {
                    name: 'My App',
                    frontend: 'react',
                    backend: 'node',
                    database: 'postgresql',
                    features: ['auth', 'api', 'ui']
                  })}
                  disabled={isWorkflowRunning}
                >
                  <Code className="w-3 h-3 mr-1" />
                  Create App
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => startWorkflow('debug-issue', {
                    description: 'General debugging',
                    error: '',
                    files: []
                  })}
                  disabled={isWorkflowRunning}
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Debug Issue
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => startWorkflow('code-review', {
                    focusAreas: ['security', 'performance'],
                    severity: 'medium'
                  })}
                  disabled={isWorkflowRunning}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Code Review
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => startWorkflow('setup-ci', {
                    type: 'fullstack',
                    framework: 'next.js'
                  })}
                  disabled={isWorkflowRunning}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Setup CI/CD
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="flex-1 p-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Available Tools</h3>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <Badge variant="outline">File System Operations</Badge>
                <Badge variant="outline">Terminal Commands</Badge>
                <Badge variant="outline">Code Generation</Badge>
                <Badge variant="outline">Project Management</Badge>
                <Badge variant="outline">Visual Analysis</Badge>
                <Badge variant="outline">Performance Optimization</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {error && (
        <div className="p-4 border-t bg-destructive/10 text-destructive text-sm">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
