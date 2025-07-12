/**
 * Firecracker Workspace Terminal
 * Web-based terminal interface for Firecracker instances
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Terminal,
  Play,
  Square,
  RotateCcw,
  Copy,
  Download,
  Upload,
  Settings,
  Maximize2,
  Minimize2,
  Plus,
  X,
  MoreHorizontal,
  Folder,
  FileText,
  Code,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useFirecracker } from '@/hooks/use-firecracker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkspaceTerminalProps {
  instanceId: string;
  className?: string;
}

interface TerminalSession {
  id: string;
  name: string;
  isActive: boolean;
  history: TerminalLine[];
  currentDirectory: string;
}

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

const mockSessions: TerminalSession[] = [
  {
    id: 'main',
    name: 'Main Terminal',
    isActive: true,
    history: [
      {
        id: '1',
        type: 'output',
        content: 'Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'output',
        content: 'Last login: Mon Jan 15 10:30:19 2024 from 192.168.1.1',
        timestamp: new Date(),
      },
    ],
    currentDirectory: '/home/ubuntu',
  },
];

const commonCommands = [
  { label: 'List files', command: 'ls -la' },
  { label: 'Current directory', command: 'pwd' },
  { label: 'System info', command: 'uname -a' },
  { label: 'Disk usage', command: 'df -h' },
  { label: 'Memory usage', command: 'free -h' },
  { label: 'Running processes', command: 'ps aux' },
  { label: 'Network interfaces', command: 'ip addr show' },
  { label: 'Install package', command: 'sudo apt update && sudo apt install ' },
];

export function WorkspaceTerminal({ instanceId, className }: WorkspaceTerminalProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>(mockSessions);
  const [activeSessionId, setActiveSessionId] = useState('main');
  const [currentCommand, setCurrentCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [fontSize, setFontSize] = useState('14');
  const [theme, setTheme] = useState('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { executeCommand } = useFirecracker({ instanceId });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.history, scrollToBottom]);

  const addLineToSession = useCallback((sessionId: string, line: TerminalLine) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, history: [...session.history, line] }
        : session
    ));
  }, []);

  const executeTerminalCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    setIsExecuting(true);
    
    // Add command to history
    const commandLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'command',
      content: `${activeSession.currentDirectory}$ ${command}`,
      timestamp: new Date(),
    };
    
    addLineToSession(activeSessionId, commandLine);

    try {
      // Execute command via API
      const result = await executeCommand(instanceId, command);
      
      // Add output to history
      const outputLine: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: result.success ? 'output' : 'error',
        content: result.output || result.error || 'Command executed',
        timestamp: new Date(),
      };
      
      addLineToSession(activeSessionId, outputLine);

      // Update current directory if it's a cd command
      if (command.startsWith('cd ')) {
        const newDir = command.substring(3).trim() || '/home/ubuntu';
        setSessions(prev => prev.map(session => 
          session.id === activeSessionId 
            ? { ...session, currentDirectory: newDir }
            : session
        ));
      }
    } catch (error) {
      const errorLine: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Command failed'}`,
        timestamp: new Date(),
      };
      
      addLineToSession(activeSessionId, errorLine);
      toast.error('Command execution failed');
    } finally {
      setIsExecuting(false);
      setCurrentCommand('');
    }
  }, [activeSessionId, activeSession.currentDirectory, instanceId, executeCommand, addLineToSession]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExecuting) {
      executeTerminalCommand(currentCommand);
    }
  }, [currentCommand, isExecuting, executeTerminalCommand]);

  const createNewSession = useCallback(() => {
    const newSession: TerminalSession = {
      id: `session-${Date.now()}`,
      name: `Terminal ${sessions.length + 1}`,
      isActive: false,
      history: [],
      currentDirectory: '/home/ubuntu',
    };
    
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  }, [sessions.length]);

  const closeSession = useCallback((sessionId: string) => {
    if (sessions.length <= 1) return;
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const clearSession = useCallback(() => {
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId 
        ? { ...session, history: [] }
        : session
    ));
  }, [activeSessionId]);

  const copySessionHistory = useCallback(() => {
    const history = activeSession.history
      .map(line => line.content)
      .join('\n');
    
    navigator.clipboard.writeText(history);
    toast.success('Terminal history copied to clipboard');
  }, [activeSession.history]);

  const insertCommand = useCallback((command: string) => {
    setCurrentCommand(command);
    inputRef.current?.focus();
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Terminal</h3>
          <Badge variant="outline">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12px</SelectItem>
              <SelectItem value="14">14px</SelectItem>
              <SelectItem value="16">16px</SelectItem>
              <SelectItem value="18">18px</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Terminal Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={createNewSession}>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearSession}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear Session
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copySessionHistory}>
                <Copy className="h-4 w-4 mr-2" />
                Copy History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Session Tabs */}
      <div className="flex items-center gap-1 border-b">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              'flex items-center gap-2 px-3 py-2 border-b-2 cursor-pointer transition-colors',
              session.id === activeSessionId
                ? 'border-primary bg-muted/50'
                : 'border-transparent hover:bg-muted/30'
            )}
            onClick={() => setActiveSessionId(session.id)}
          >
            <span className="text-sm font-medium">{session.name}</span>
            {sessions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  closeSession(session.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={createNewSession}
          className="ml-2"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Terminal Output */}
        <Card className={cn('lg:col-span-3', isFullscreen && 'fixed inset-4 z-50')}>
          <CardContent className="p-0">
            <div
              className={cn(
                'font-mono text-sm h-96 overflow-auto p-4',
                theme === 'dark' 
                  ? 'bg-gray-900 text-green-400' 
                  : 'bg-gray-50 text-gray-900',
                isFullscreen && 'h-[calc(100vh-8rem)]'
              )}
              style={{ fontSize: `${fontSize}px` }}
              ref={terminalRef}
            >
              {activeSession.history.map((line) => (
                <div
                  key={line.id}
                  className={cn(
                    'mb-1',
                    line.type === 'command' && 'text-blue-400 font-semibold',
                    line.type === 'error' && 'text-red-400',
                    line.type === 'output' && theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}
                >
                  {line.content}
                </div>
              ))}
              
              {/* Current Input Line */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-blue-400 font-semibold">
                  {activeSession.currentDirectory}$
                </span>
                <Input
                  ref={inputRef}
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isExecuting}
                  className={cn(
                    'border-none bg-transparent p-0 font-mono focus-visible:ring-0',
                    theme === 'dark' ? 'text-green-400' : 'text-gray-900'
                  )}
                  style={{ fontSize: `${fontSize}px` }}
                  placeholder={isExecuting ? 'Executing...' : 'Enter command...'}
                />
                {isExecuting && (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Commands */}
        {!isFullscreen && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Commands</CardTitle>
              <CardDescription>Common terminal commands</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {commonCommands.map((cmd, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => insertCommand(cmd.command)}
                >
                  <div>
                    <div className="font-medium text-xs">{cmd.label}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {cmd.command}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Folder className="h-3 w-3" />
            {activeSession.currentDirectory}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Session: {activeSession.name}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {activeSession.history.length} lines
          </span>
          {isExecuting ? (
            <span className="flex items-center gap-1 text-orange-500">
              <Zap className="h-3 w-3" />
              Executing...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-500">
              <CheckCircle className="h-3 w-3" />
              Ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
