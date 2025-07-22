'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Terminal as TerminalIcon, 
  Plus, 
  X, 
  Search, 
  Copy, 
  Download,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirecrackerWorkspace, FirecrackerVMStatus } from '@/lib/types/firecracker';

interface FirecrackerTerminalProps {
  workspace: FirecrackerWorkspace;
  vmStatus: FirecrackerVMStatus;
  className?: string;
  containerId?: string; // Optional: connect to specific container
}

interface TerminalSession {
  id: string;
  title: string;
  terminal: Terminal;
  fitAddon: FitAddon;
  isActive: boolean;
  containerId?: string;
  containerName?: string;
}

export function FirecrackerTerminal({ 
  workspace, 
  vmStatus, 
  className,
  containerId 
}: FirecrackerTerminalProps) {
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize first terminal session
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  // Handle VM status changes
  useEffect(() => {
    if (vmStatus.status === 'RUNNING' && sessions.length > 0) {
      // Reconnect terminals when VM starts
      sessions.forEach(session => {
        connectToVM(session.id);
      });
    } else if (vmStatus.status !== 'RUNNING') {
      // Disconnect terminals when VM stops
      disconnectAll();
    }
  }, [vmStatus.status]);

  const createNewSession = (targetContainerId?: string, containerName?: string) => {
    const sessionId = `session-${Date.now()}`;
    const terminal = new Terminal({
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selection: '#3e3e3e',
      },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      cursorBlink: true,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.loadAddon(searchAddon);

    const newSession: TerminalSession = {
      id: sessionId,
      title: containerName ? `${containerName}` : targetContainerId ? `Container ${targetContainerId.slice(0, 8)}` : 'VM Terminal',
      terminal,
      fitAddon,
      isActive: true,
      containerId: targetContainerId,
      containerName,
    };

    setSessions(prev => {
      const updated = prev.map(s => ({ ...s, isActive: false }));
      return [...updated, newSession];
    });
    setActiveSessionId(sessionId);

    // Connect to terminal after DOM update
    setTimeout(() => {
      const terminalElement = terminalRefs.current.get(sessionId);
      if (terminalElement) {
        terminal.open(terminalElement);
        fitAddon.fit();
        
        if (vmStatus.status === 'RUNNING') {
          connectToVM(sessionId);
        } else {
          terminal.writeln('\x1b[33mVM is not running. Start the VM to use the terminal.\x1b[0m');
        }
      }
    }, 100);
  };

  const connectToVM = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    setIsConnecting(true);
    
    try {
      // In a real implementation, this would establish a WebSocket connection
      // to the Firecracker VM or container terminal
      const wsUrl = session.containerId 
        ? `ws://localhost:8080/api/firecracker/workspaces/${workspace.id}/containers/${session.containerId}/terminal`
        : `ws://localhost:8080/api/firecracker/workspaces/${workspace.id}/vm/terminal`;

      // Simulate connection for now
      session.terminal.writeln('\x1b[32mConnecting to terminal...\x1b[0m');
      
      setTimeout(() => {
        session.terminal.writeln('\x1b[32mConnected to Firecracker VM\x1b[0m');
        session.terminal.writeln('');
        
        if (session.containerId) {
          session.terminal.writeln(`\x1b[36mContainer: ${session.containerName || session.containerId}\x1b[0m`);
        } else {
          session.terminal.writeln(`\x1b[36mFirecracker VM: ${vmStatus.id}\x1b[0m`);
        }
        
        session.terminal.writeln('');
        session.terminal.write('$ ');
        
        // Set up input handling
        session.terminal.onData((data) => {
          // In a real implementation, send data to WebSocket
          session.terminal.write(data);
          
          if (data === '\r') {
            session.terminal.write('\n$ ');
          }
        });
        
        setIsConnecting(false);
      }, 1000);

    } catch (error) {
      console.error('Failed to connect to terminal:', error);
      session.terminal.writeln('\x1b[31mFailed to connect to terminal\x1b[0m');
      setIsConnecting(false);
    }
  };

  const disconnectAll = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    sessions.forEach(session => {
      session.terminal.writeln('\x1b[33m\nConnection lost. VM is not running.\x1b[0m');
    });
  };

  const closeSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.terminal.dispose();
      terminalRefs.current.delete(sessionId);
    }

    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length > 0 && activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const switchSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => ({ 
      ...s, 
      isActive: s.id === sessionId 
    })));
    setActiveSessionId(sessionId);
  };

  const clearTerminal = () => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (activeSession) {
      activeSession.terminal.clear();
    }
  };

  const copyTerminalContent = () => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    if (activeSession) {
      const selection = activeSession.terminal.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      }
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      sessions.forEach(session => {
        session.fitAddon.fit();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4" />
            <CardTitle className="text-sm">Terminal</CardTitle>
            <Badge variant={vmStatus.status === 'RUNNING' ? 'default' : 'secondary'} className="text-xs">
              {vmStatus.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={vmStatus.status !== 'RUNNING'}
                  title="New Terminal"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => createNewSession()}>
                  <TerminalIcon className="h-4 w-4 mr-2" />
                  VM Terminal
                </DropdownMenuItem>
                {workspace.containers.map((container) => (
                  <DropdownMenuItem
                    key={container.id}
                    onClick={() => createNewSession(container.id, container.name)}
                    disabled={container.status !== 'RUNNING'}
                  >
                    <Container className="h-4 w-4 mr-2" />
                    {container.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTerminal}
              disabled={!activeSession}
              title="Clear Terminal"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={copyTerminalContent}
              disabled={!activeSession}
              title="Copy Selection"
            >
              <Copy className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        
        {/* Terminal Tabs */}
        {sessions.length > 1 && (
          <div className="flex items-center gap-1 mt-2">
            {sessions.map(session => (
              <div
                key={session.id}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer",
                  session.isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
                onClick={() => switchSession(session.id)}
              >
                <span>{session.title}</span>
                {sessions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeSession(session.id);
                    }}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative">
        {sessions.map(session => (
          <div
            key={session.id}
            ref={(el) => {
              if (el) terminalRefs.current.set(session.id, el);
            }}
            className={cn(
              "absolute inset-0 bg-[#1a1a1a]",
              session.isActive ? "block" : "hidden"
            )}
            style={{ 
              height: isMaximized ? 'calc(100vh - 120px)' : '100%',
              zIndex: isMaximized ? 50 : 'auto'
            }}
          />
        ))}
        
        {sessions.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <TerminalIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No terminal sessions</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => createNewSession()}
                disabled={vmStatus.status !== 'RUNNING'}
              >
                <Plus className="h-3 w-3 mr-1" />
                New Terminal
              </Button>
            </div>
          </div>
        )}
        
        {isConnecting && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Connecting to terminal...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
