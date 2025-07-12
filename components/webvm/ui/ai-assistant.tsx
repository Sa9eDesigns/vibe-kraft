'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bot, 
  Send, 
  User, 
  Maximize2, 
  Minimize2,
  Copy,
  Download,
  Trash2,
  MessageSquare,
  Terminal,
  Mic,
  MicOff,
  Camera,
  Square} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DevSandbox } from '../core/dev-sandbox';
import type { AIMessage } from '../types';

interface AIAssistantProps {
  sandbox: DevSandbox;
  model: 'claude-3.7' | 'gpt-4' | 'custom';
  capabilities: ('terminal' | 'visual' | 'code-generation' | 'debugging' | 'file-system')[];
  onCommand?: (command: string) => void;
  onCodeGenerate?: (code: string, language: string) => void;
  className?: string;
  height?: string | number;
}

interface ToolInvocation {
  name: string;
  parameters: Record<string, any>;
  result?: any;
  status: 'pending' | 'completed' | 'error';
}

export function AIAssistant({
  sandbox,
  model,
  capabilities,
  onCommand,
  onCodeGenerate,
  className,
  height = '100%'
}: AIAssistantProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [toolInvocations, setToolInvocations] = useState<Map<string, ToolInvocation>>(new Map());
  const [currentContext, setCurrentContext] = useState<string>('general');
  const [aiSettings, setAiSettings] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    enableTools: true,
    enableVision: capabilities.includes('visual'),
    enableFileSystem: capabilities.includes('file-system')
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const screenshotCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize chat with AI SDK
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
    initialInput: '',
    initialMessages: [
      {
        id: 'system',
        role: 'system',
        content: `You are an AI assistant helping with development tasks in a WebVM environment. 
        You have access to the following capabilities: ${capabilities.join(', ')}.
        
        Available tools:
        - Terminal commands (bash tool)
        - File system operations
        - Code generation and analysis
        - Visual interface control (computer tool)
        - Screenshot analysis
        
        Be helpful, precise, and always confirm before executing potentially destructive operations.`
      }
    ],
    onError: (error) => {
      console.error('AI Chat Error:', error);
    },
    onFinish: (message) => {
      // Handle tool invocations
      handleToolInvocations(message);
    }
  });

  // Handle tool invocations from AI responses
  const handleToolInvocations = useCallback(async (message: any) => {
    if (!message.toolInvocations) return;
    
    for (const invocation of message.toolInvocations) {
      const toolInvocation: ToolInvocation = {
        name: invocation.toolName,
        parameters: invocation.args,
        status: 'pending'
      };
      
      setToolInvocations(prev => new Map(prev).set(invocation.toolCallId, toolInvocation));
      
      try {
        let result;
        
        switch (invocation.toolName) {
          case 'bash':
            result = await executeBashCommand(invocation.args.command);
            break;
          case 'readFile':
            result = await readFile(invocation.args.path);
            break;
          case 'writeFile':
            result = await writeFile(invocation.args.path, invocation.args.content);
            break;
          case 'listFiles':
            result = await listFiles(invocation.args.path);
            break;
          case 'screenshot':
            result = await takeScreenshot();
            break;
          case 'codeGenerate':
            result = await generateCode(invocation.args.prompt, invocation.args.language);
            break;
          default:
            result = { error: `Unknown tool: ${invocation.toolName}` };
        }
        
        setToolInvocations(prev => {
          const updated = new Map(prev);
          updated.set(invocation.toolCallId, {
            ...toolInvocation,
            result,
            status: 'completed'
          });
          return updated;
        });
        
      } catch (error: any) {
        console.error('Tool execution error:', error);
        setToolInvocations(prev => {
          const updated = new Map(prev);
          updated.set(invocation.toolCallId, {
            ...toolInvocation,
            result: { error: error.message },
            status: 'error'
          });
          return updated;
        });
      }
    }
  }, []);

  // Tool implementations
  const executeBashCommand = useCallback(async (command: string) => {
    if (!sandbox.isReady()) {
      throw new Error('Sandbox is not ready');
    }
    
    onCommand?.(command);
    
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    const result = await sandbox.executeCommand(cmd, args);
    
    return {
      command,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration: result.duration
    };
  }, [sandbox, onCommand]);

  const readFile = useCallback(async (path: string) => {
    if (!sandbox.isReady()) {
      throw new Error('Sandbox is not ready');
    }
    
    const content = await sandbox.readFile(path);
    return { path, content };
  }, [sandbox]);

  const writeFile = useCallback(async (path: string, content: string) => {
    if (!sandbox.isReady()) {
      throw new Error('Sandbox is not ready');
    }
    
    await sandbox.writeFile(path, content);
    return { path, success: true };
  }, [sandbox]);

  const listFiles = useCallback(async (path: string) => {
    if (!sandbox.isReady()) {
      throw new Error('Sandbox is not ready');
    }
    
    const files = await sandbox.listFiles(path);
    return { path, files };
  }, [sandbox]);

  const takeScreenshot = useCallback(async () => {
    if (!aiSettings.enableVision) {
      throw new Error('Vision capabilities are disabled');
    }
    
    // Get the WebVM display canvas
    const displayCanvas = document.getElementById('webvm-display') as HTMLCanvasElement;
    if (!displayCanvas) {
      throw new Error('WebVM display not found');
    }
    
    // Create screenshot canvas
    const canvas = screenshotCanvasRef.current;
    if (!canvas) {
      throw new Error('Screenshot canvas not available');
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    // Resize canvas to match display
    canvas.width = displayCanvas.width;
    canvas.height = displayCanvas.height;
    
    // Draw display to screenshot canvas
    ctx.drawImage(displayCanvas, 0, 0);
    
    // Convert to base64
    const dataUrl = canvas.toDataURL('image/png');
    
    return {
      screenshot: dataUrl,
      width: canvas.width,
      height: canvas.height,
      timestamp: new Date().toISOString()
    };
  }, [aiSettings.enableVision]);

  const generateCode = useCallback(async (prompt: string, language: string) => {
    // This would typically call a code generation API
    // For now, we'll return a placeholder
    const generatedCode = `// Generated code for: ${prompt}\n// Language: ${language}\n\nconsole.log("Code generation not yet implemented");`;
    
    onCodeGenerate?.(generatedCode, language);
    
    return {
      prompt,
      language,
      code: generatedCode
    };
  }, [onCodeGenerate]);

  // Handle context switching
  const switchContext = useCallback((newContext: string) => {
    setCurrentContext(newContext);
    
    // Add context message
    const contextMessage = {
      id: `context-${Date.now()}`,
      role: 'system' as const,
      content: `Context switched to: ${newContext}. Please adapt your responses accordingly.`,
      timestamp: new Date()
    };
    
    setConversationHistory(prev => [...prev, contextMessage]);
  }, []);

  // Copy message content
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setConversationHistory([]);
    // Note: useChat doesn't provide a clear method, so we'd need to reload
    window.location.reload();
  }, []);

  // Export conversation
  const exportConversation = useCallback(() => {
    const conversation = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date()
    }));
    
    const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice input (placeholder)
  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
    // Voice input implementation would go here
  }, []);

  // Handle screen capture
  const toggleScreenCapture = useCallback(() => {
    setIsCapturingScreen(prev => !prev);
    // Screen capture implementation would go here
  }, []);

  // Render message
  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    
    return (
      <div
        key={message.id || index}
        className={cn(
          'flex gap-3 p-4 rounded-lg',
          isUser ? 'bg-primary/10' : 'bg-muted/50',
          isSystem && 'bg-yellow-50 dark:bg-yellow-900/20'
        )}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
            </span>
            <Badge variant="outline" className="text-xs">
              {message.role}
            </Badge>
          </div>
          
          <div className="prose prose-sm max-w-none">
            {message.content}
          </div>
          
          {/* Tool invocations */}
          {message.toolInvocations && (
            <div className="space-y-2">
              {message.toolInvocations.map((invocation: any, idx: number) => {
                const toolState = toolInvocations.get(invocation.toolCallId);
                return (
                  <div key={idx} className="bg-background border rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Terminal className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {invocation.toolName}
                      </span>
                      <Badge 
                        variant={
                          toolState?.status === 'completed' ? 'default' :
                          toolState?.status === 'error' ? 'destructive' : 'secondary'
                        }
                      >
                        {toolState?.status || 'pending'}
                      </Badge>
                    </div>
                    
                    <pre className="text-xs text-muted-foreground mb-2">
                      {JSON.stringify(invocation.args, null, 2)}
                    </pre>
                    
                    {toolState?.result && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <pre className="text-xs">
                          {JSON.stringify(toolState.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyMessage(message.content)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('flex flex-col h-full', isMaximized && 'fixed inset-0 z-50', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
            <Badge variant="outline">
              {model}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={currentContext} onValueChange={switchContext}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
                <SelectItem value="debugging">Debugging</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={exportConversation}>
              <Download className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={clearConversation}>
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-4" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          <span>Capabilities: {capabilities.join(', ')}</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" style={{ height }}>
          <div className="space-y-4">
            {messages.map(renderMessage)}
            
            {isLoading && (
              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <Bot className="h-4 w-4 animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  AI is thinking...
                </span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-sm text-red-600 dark:text-red-400">
                  Error: {error.message}
                </span>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything about your code, system, or development tasks..."
                className="flex-1 min-h-[40px] max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
                
                {isLoading && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={stop}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {capabilities.includes('visual') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleScreenCapture}
                  className={cn(isCapturingScreen && 'bg-red-100 dark:bg-red-900/20')}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleRecording}
                className={cn(isRecording && 'bg-red-100 dark:bg-red-900/20')}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <div className="flex-1" />
              
              <span className="text-xs text-muted-foreground">
                {input.length}/2000
              </span>
            </div>
          </form>
        </div>
      </CardContent>
      
      {/* Hidden canvas for screenshots */}
      <canvas
        ref={screenshotCanvasRef}
        className="hidden"
        width={1024}
        height={768}
      />
    </Card>
  );
}