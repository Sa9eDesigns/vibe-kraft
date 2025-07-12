'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  Bot,
  ChevronUp,
  ChevronDown,
  Copy,
  Download
} from 'lucide-react';
import type { DevSandbox } from '../core/dev-sandbox';

// Dynamic imports for xterm to avoid SSR issues
let XTerm: any = null;
let FitAddon: any = null;
let WebLinksAddon: any = null;

// Load xterm dynamically
const loadXTerm = async () => {
  if (typeof window === 'undefined') return null;
  
  if (!XTerm) {
    const [xtermModule, fitModule, webLinksModule] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('@xterm/addon-web-links')
    ]);
    
    XTerm = xtermModule.Terminal;
    FitAddon = fitModule.FitAddon;
    WebLinksAddon = webLinksModule.WebLinksAddon;
  }
  
  return { XTerm, FitAddon, WebLinksAddon };
};

interface TerminalProps {
  sandbox: DevSandbox;
  className?: string;
  aiIntegration?: boolean;
  onCommandExecute?: (command: string) => void;
  onOutput?: (output: string) => void;
}

export function TerminalClient({ 
  sandbox, 
  className = '', 
  aiIntegration = true,
  onCommandExecute,
  onOutput 
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const { theme } = useTheme();
  
  const [isConnected, setIsConnected] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showAI, setShowAI] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize terminal
  useEffect(() => {
    const initTerminal = async () => {
      if (!terminalRef.current) return;
      
      try {
        const xtermModules = await loadXTerm();
        if (!xtermModules) return;
        
        const { XTerm, FitAddon, WebLinksAddon } = xtermModules;
        
        const xterm = new XTerm({
          theme: {
            background: theme === 'dark' ? '#0a0a0a' : '#ffffff',
            foreground: theme === 'dark' ? '#ffffff' : '#000000',
            cursor: theme === 'dark' ? '#ffffff' : '#000000',
          },
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          fontSize: 14,
          cursorBlink: true,
          allowTransparency: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        xterm.loadAddon(fitAddon);
        xterm.loadAddon(webLinksAddon);

        xterm.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        // Connect to sandbox if ready
        if (sandbox && sandbox.isReady()) {
          connectToSandbox(xterm);
        }

        setIsLoading(false);
        
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
        setIsLoading(false);
      }
    };

    initTerminal();

    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [theme]);

  // Connect terminal to sandbox
  const connectToSandbox = useCallback((xterm: any) => {
    if (!sandbox || !sandbox.isReady()) {
      console.warn('Sandbox not ready for terminal connection');
      return;
    }

    try {
      // Set up terminal connection
      xterm.write('Welcome to WebVM Terminal\r\n');
      xterm.write('$ ');
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect terminal to sandbox:', error);
    }
  }, [sandbox]);

  // Execute command
  const executeCommand = useCallback(async (command: string) => {
    if (!sandbox || !sandbox.isReady() || !xtermRef.current) return;

    try {
      xtermRef.current.write(`\r\n`);
      
      const result = await sandbox.executeCommand('bash', ['-c', command]);
      
      if (result.stdout) {
        xtermRef.current.write(result.stdout);
      }
      
      if (result.stderr) {
        xtermRef.current.write(`\x1b[31m${result.stderr}\x1b[0m`);
      }
      
      xtermRef.current.write('\r\n$ ');
      
      // Add to history
      if (command.trim()) {
        setCommandHistory(prev => [...prev.slice(-49), command]);
        setHistoryIndex(-1);
      }
      
      onCommandExecute?.(command);
      onOutput?.(result.stdout || result.stderr || '');
      
    } catch (error) {
      console.error('Command execution failed:', error);
      xtermRef.current.write(`\x1b[31mError: ${error}\x1b[0m\r\n$ `);
    }
  }, [sandbox, onCommandExecute, onOutput]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Terminal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading terminal...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Terminal</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAI(!showAI)}
              disabled={!sandbox || !sandbox.isReady()}
            >
              <Bot className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={terminalRef} 
          className="h-64 w-full bg-background border-t"
          style={{ minHeight: '200px' }}
        />
      </CardContent>
    </Card>
  );
}
