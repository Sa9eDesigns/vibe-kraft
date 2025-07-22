'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { useConversationManager } from '@/hooks/use-conversation-manager';
import { ToolExecutionVisualizer } from './tool-execution-visualizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Workflow,
  Mic,
  MicOff,
  Image,
  Paperclip,
  MoreHorizontal,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Maximize2,
  Minimize2,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdvancedChatInterfaceProps {
  className?: string;
  workspaceContext?: any;
  onToolExecution?: (tool: string, params: any, result: any) => void;
  onContextUpdate?: (context: any) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolInvocations?: any[];
  isStreaming?: boolean;
  metadata?: {
    model?: string;
    tokens?: number;
    executionTime?: number;
  };
}

interface ToolExecution {
  id: string;
  name: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  progress?: number;
  startTime: Date;
  endTime?: Date;
}

type ModelType = 'gpt-4o' | 'claude-3-5-sonnet-20241022' | 'gemini-1.5-pro';
type AgentMode = 'chat' | 'development' | 'review' | 'devops' | 'testing';

export function AdvancedChatInterface({ 
  className, 
  workspaceContext,
  onToolExecution,
  onContextUpdate,
  isFullscreen = false,
  onToggleFullscreen
}: AdvancedChatInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState<ModelType>('claude-3-5-sonnet-20241022');
  const [agentMode, setAgentMode] = useState<AgentMode>('chat');
  const [isRecording, setIsRecording] = useState(false);
  const [toolExecutions, setToolExecutions] = useState<Map<string, ToolExecution>>(new Map());
  const [isTyping, setIsTyping] = useState(false);

  // Conversation management
  const conversationManager = useConversationManager({
    autoSave: true,
    maxRecentConversations: 10
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize conversation if none exists
  useEffect(() => {
    if (!conversationManager.currentConversation && !conversationManager.isLoading) {
      conversationManager.createConversation({
        title: 'New Conversation',
        model: selectedModel,
        agentMode,
        workspaceContext
      });
    }
  }, [conversationManager.currentConversation, conversationManager.isLoading, selectedModel, agentMode, workspaceContext]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    stop,
    reload,
    data,
    setMessages
  } = useChat({
    api: '/api/ai/chat',
    initialMessages: conversationManager.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.timestamp
    })),
    body: {
      model: selectedModel,
      agentMode,
      conversationId: conversationManager.currentConversation?.id,
      context: {
        workspace: workspaceContext,
        conversationId: conversationManager.currentConversation?.id,
        timestamp: new Date().toISOString()
      }
    },
    onError: (error) => {
      console.error('AI Chat Error:', error);
      toast.error('Chat error: ' + error.message);
    },
    onFinish: (message) => {
      handleMessageFinish(message);
      setIsTyping(false);

      // Save assistant message to conversation
      if (conversationManager.currentConversation) {
        conversationManager.addMessage({
          role: 'assistant',
          content: message.content,
          model: selectedModel,
          toolInvocations: message.toolInvocations,
          metadata: {
            finishReason: 'stop' // This would come from the API response
          }
        });
      }
    },
    onResponse: () => {
      setIsTyping(true);
    }
  });

  // Custom submit handler to save user messages
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Save user message to conversation
    if (conversationManager.currentConversation && input.trim()) {
      conversationManager.addMessage({
        role: 'user',
        content: input.trim()
      });
    }

    // Call original submit
    originalHandleSubmit(e);
  }, [conversationManager, input, originalHandleSubmit]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleMessageFinish = useCallback((message: any) => {
    // Handle tool executions
    if (message.toolInvocations) {
      message.toolInvocations.forEach((invocation: any) => {
        const execution: ToolExecution = {
          id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: invocation.toolName,
          parameters: invocation.args,
          status: invocation.result ? 'completed' : 'error',
          result: invocation.result,
          startTime: new Date(),
          endTime: new Date()
        };
        
        setToolExecutions(prev => new Map(prev.set(execution.id, execution)));
        
        if (onToolExecution) {
          onToolExecution(invocation.toolName, invocation.args, invocation.result);
        }
      });
    }

    // Update workspace context if provided
    if (message.context && onContextUpdate) {
      onContextUpdate(message.context);
    }
  }, [onToolExecution, onContextUpdate]);

  const handleModelChange = useCallback((value: string) => {
    setSelectedModel(value as ModelType);
    toast.success(`Switched to ${value}`);
  }, []);

  const handleAgentModeChange = useCallback((value: string) => {
    setAgentMode(value as AgentMode);
    toast.success(`Agent mode: ${value}`);
  }, []);

  const handleVoiceToggle = useCallback(() => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.success('Voice recording started');
      // TODO: Implement voice recording
    } else {
      toast.success('Voice recording stopped');
      // TODO: Stop voice recording and process
    }
  }, [isRecording]);

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  }, []);

  const handleRegenerateResponse = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        // Remove the last assistant message and regenerate
        const filteredMessages = messages.slice(0, -1);
        setMessages(filteredMessages);
        reload();
      }
    }
  }, [messages, setMessages, reload]);

  const renderMessage = useCallback((message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';
    
    return (
      <div key={message.id} className={cn(
        "flex gap-3 mb-4",
        isUser ? "justify-end" : "justify-start"
      )}>
        {!isUser && (
          <Avatar className="w-8 h-8 mt-1">
            <AvatarFallback className="bg-primary/10">
              <Bot className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn(
          "max-w-[80%] space-y-2",
          isUser ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "rounded-lg px-4 py-2 text-sm",
            isUser 
              ? "bg-primary text-primary-foreground ml-auto" 
              : "bg-muted",
            message.isStreaming && "animate-pulse"
          )}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {/* Tool executions */}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.toolInvocations.map((invocation: any, idx: number) => (
                  <div key={idx} className="text-xs bg-background/50 rounded p-2">
                    <div className="flex items-center gap-1">
                      <Terminal className="w-3 h-3" />
                      <span className="font-medium">{invocation.toolName}</span>
                      <Badge variant="outline" className="text-xs">
                        {invocation.result ? 'completed' : 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Message actions */}
          {isAssistant && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopyMessage(message.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={handleRegenerateResponse}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate response</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          {/* Message metadata */}
          {message.metadata && (
            <div className="text-xs text-muted-foreground">
              {message.metadata.model && (
                <span className="mr-2">{message.metadata.model}</span>
              )}
              {message.metadata.tokens && (
                <span className="mr-2">{message.metadata.tokens} tokens</span>
              )}
              {message.metadata.executionTime && (
                <span>{message.metadata.executionTime}ms</span>
              )}
            </div>
          )}
        </div>
        
        {isUser && (
          <Avatar className="w-8 h-8 mt-1">
            <AvatarFallback className="bg-secondary">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }, [handleCopyMessage, handleRegenerateResponse]);

  return (
    <div className={cn(
      "flex flex-col h-full bg-background",
      isFullscreen && "fixed inset-0 z-50",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {selectedModel}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {agentMode}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
          
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Model and Agent Selection */}
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Model</label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
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
            <label className="text-xs font-medium text-muted-foreground">Agent Mode</label>
            <Select value={agentMode} onValueChange={handleAgentModeChange}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="review">Code Review</SelectItem>
                <SelectItem value="devops">DevOps</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Start a conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Ask me anything about your workspace, code, or development tasks.
                    I can help with coding, debugging, file operations, and more.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 max-w-md">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const prompt = "Help me understand the current project structure";
                      handleInputChange({ target: { value: prompt } } as any);
                    }}
                  >
                    Analyze project
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const prompt = "Create a new React component";
                      handleInputChange({ target: { value: prompt } } as any);
                    }}
                  >
                    Create component
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const prompt = "Review my code for improvements";
                      handleInputChange({ target: { value: prompt } } as any);
                    }}
                  >
                    Code review
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 group">
                {messages.map((message, index) => renderMessage({
                  ...message,
                  timestamp: message.createdAt || new Date()
                } as ChatMessage, index))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex items-center gap-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Tool Executions Panel */}
      {toolExecutions.size > 0 && (
        <div className="border-t">
          <ToolExecutionVisualizer
            executions={Array.from(toolExecutions.values())}
            onRetry={(execution) => {
              console.log('Retry execution:', execution);
              // TODO: Implement retry logic
            }}
            onCancel={(execution) => {
              console.log('Cancel execution:', execution);
              // TODO: Implement cancel logic
            }}
            onClear={(executionId) => {
              setToolExecutions(prev => {
                const newMap = new Map(prev);
                newMap.delete(executionId);
                return newMap;
              });
            }}
            onClearAll={() => {
              setToolExecutions(new Map());
            }}
            maxHeight="200px"
            showLogs={true}
            autoScroll={true}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              placeholder={`Ask ${selectedModel} anything about your workspace...`}
              className="min-h-[60px] max-h-32 resize-none pr-24"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />

            {/* Input actions */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleVoiceToggle}
                    >
                      {isRecording ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? 'Stop recording' : 'Voice input'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Image className="w-4 h-4" alt="" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add image</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLoading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={stop}
                >
                  <Square className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              )}

              {error && (
                <div className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {input.length > 0 && `${input.length} chars`}
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="min-w-[80px]"
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                    Sending
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
