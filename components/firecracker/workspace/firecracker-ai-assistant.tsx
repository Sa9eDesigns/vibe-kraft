'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  Loader2,
  Code,
  Terminal,
  Container,
  Settings,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirecrackerWorkspace } from '@/lib/types/firecracker';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'command';
  language?: string;
}

interface FirecrackerAIAssistantProps {
  workspace: FirecrackerWorkspace;
  className?: string;
}

export function FirecrackerAIAssistant({ workspace, className }: FirecrackerAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI assistant for the ${workspace.name} Firecracker workspace. I can help you with:\n\n• Container management and Docker commands\n• Code analysis and debugging\n• Infrastructure configuration\n• VM optimization\n• Development workflows\n\nWhat would you like to work on today?`,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // In a real implementation, this would call the AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          workspace_id: workspace.id,
          workspace_type: 'firecracker',
          context: {
            vm_status: workspace.vm.status,
            containers: workspace.containers.map(c => ({
              name: c.name,
              image: c.image,
              status: c.status
            }))
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
          type: data.type || 'text',
          language: data.language
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Mock response for demonstration
      const mockResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(userMessage.content),
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, mockResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('container') || input.includes('docker')) {
      return `I can help you with container management in your Firecracker workspace. Here are some common commands:\n\n\`\`\`bash\n# List running containers\ndocker ps\n\n# Create a new container\ndocker run -d --name myapp nginx\n\n# Execute commands in a container\ndocker exec -it myapp bash\n\`\`\`\n\nWould you like me to help you with a specific container task?`;
    }

    if (input.includes('vm') || input.includes('firecracker')) {
      return `Your Firecracker VM is currently ${workspace.vm.status}. I can help you with:\n\n• VM configuration and optimization\n• Resource allocation (CPU, memory)\n• Network configuration\n• Snapshot management\n• Performance monitoring\n\nWhat specific aspect would you like to work on?`;
    }

    if (input.includes('code') || input.includes('debug')) {
      return `I can assist with code analysis and debugging in your Firecracker environment. I can:\n\n• Review code for issues\n• Suggest optimizations\n• Help with debugging strategies\n• Explain error messages\n• Recommend best practices\n\nPlease share your code or describe the issue you're facing.`;
    }

    return `I understand you're asking about "${userInput}". As your Firecracker workspace AI assistant, I can help with container management, VM configuration, code analysis, and development workflows. Could you provide more specific details about what you'd like to accomplish?`;
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const clearChat = () => {
    setMessages([messages[0]]); // Keep the welcome message
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 p-3 rounded-lg",
          isUser ? "bg-primary/10 ml-8" : "bg-muted/50 mr-8"
        )}
      >
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          {isUser ? (
            <div className="w-4 h-4 rounded-full bg-current" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </span>
            {message.type === 'code' && (
              <Badge variant="outline" className="text-xs">
                <Code className="w-3 h-3 mr-1" />
                {message.language || 'code'}
              </Badge>
            )}
          </div>

          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>

          {!isUser && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content)}
                className="h-6 px-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
            <Badge variant="outline" className="text-xs">
              Firecracker
            </Badge>
          </CardTitle>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              title="Clear Chat"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" title="Settings">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 p-3 overflow-auto" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map(renderMessage)}

            {isLoading && (
              <div className="flex gap-3 p-3 rounded-lg bg-muted/50 mr-8">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">AI Assistant</span>
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Thinking...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about containers, VM configuration, code help..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Container className="w-3 h-3" />
            <span>{workspace.containers.length} containers</span>
            <span>•</span>
            <span>VM: {workspace.vm.status}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
