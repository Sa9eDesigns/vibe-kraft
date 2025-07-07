'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Terminal as TerminalIcon, 
  Settings, 
  Maximize2, 
  Minimize2,
  Bot,
  Copy,
  Trash2,
  Play,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DevSandbox } from '../core/dev-sandbox';
import type { TerminalConfig, TerminalTheme } from '../types';

// Import xterm.js styles
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  sandbox: DevSandbox;
  theme?: 'dark' | 'light';
  aiIntegration?: boolean;
  customPrompt?: string;
  onOutput?: (output: string) => void;
  onCommand?: (command: string) => void;
  className?: string;
  height?: string | number;
  width?: string | number;
  config?: Partial<TerminalConfig>;
}

export function Terminal({
  sandbox,
  theme,
  aiIntegration = false,
  customPrompt = 'user@webvm:~$ ',
  onOutput,
  onCommand,
  className,
  height = '100%',
  width = '100%',
  config = {}
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme: systemTheme } = useTheme();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Terminal themes
  const themes: Record<string, TerminalTheme> = {
    dark: {
      foreground: '#ffffff',
      background: '#000000',
      cursor: '#ffffff',
      selection: '#ffffff40',
      black: '#000000',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#8be9fd',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2',
      brightBlack: '#44475a',
      brightRed: '#ff5555',
      brightGreen: '#50fa7b',
      brightYellow: '#f1fa8c',
      brightBlue: '#8be9fd',
      brightMagenta: '#ff79c6',
      brightCyan: '#8be9fd',
      brightWhite: '#ffffff'
    },
    light: {
      foreground: '#000000',
      background: '#ffffff',
      cursor: '#000000',
      selection: '#00000040',
      black: '#000000',
      red: '#cc0000',
      green: '#4e9a06',
      yellow: '#c4a000',
      blue: '#3465a4',
      magenta: '#75507b',
      cyan: '#06989a',
      white: '#d3d7cf',
      brightBlack: '#555753',
      brightRed: '#ef2929',
      brightGreen: '#8ae234',
      brightYellow: '#fce94f',
      brightBlue: '#729fcf',
      brightMagenta: '#ad7fa8',
      brightCyan: '#34e2e2',
      brightWhite: '#eeeeec'
    }
  };

  // Default terminal configuration
  const defaultConfig: TerminalConfig = {
    rows: 24,
    cols: 80,
    cursorBlink: true,
    cursorStyle: 'block',
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Monaco, Consolas, "Courier New", monospace',
    theme: themes[theme || (systemTheme === 'dark' ? 'dark' : 'light')],
    scrollback: 1000,
    bellStyle: 'none',
    ...config
  };

  // Initialize terminal
  const initializeTerminal = useCallback(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const xterm = new XTerm({
      rows: defaultConfig.rows,
      cols: defaultConfig.cols,
      cursorBlink: defaultConfig.cursorBlink,
      cursorStyle: defaultConfig.cursorStyle,
      fontSize: defaultConfig.fontSize,
      fontFamily: defaultConfig.fontFamily,
      theme: defaultConfig.theme,
      scrollback: defaultConfig.scrollback,
      bellStyle: defaultConfig.bellStyle,
      allowTransparency: true,
      convertEol: true,
      disableStdin: false,
      screenKeys: true,
      useFlowControl: true,
      allowProposedApi: true
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    
    // Open terminal
    xterm.open(terminalRef.current);
    fitAddon.fit();
    
    // Store references
    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;
    
    // Setup event handlers
    setupTerminalHandlers(xterm);
    
    // Connect to sandbox
    connectToSandbox(xterm);
    
    // Focus terminal
    xterm.focus();
    
  }, [defaultConfig]);

  // Setup terminal event handlers
  const setupTerminalHandlers = useCallback((xterm: XTerm) => {
    let inputBuffer = '';
    
    // Handle key input
    xterm.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
      
      if (domEvent.keyCode === 13) { // Enter
        const command = inputBuffer.trim();
        if (command) {
          executeCommand(command);
          setCommandHistory(prev => [...prev, command]);
          setHistoryIndex(-1);
        }
        inputBuffer = '';
        xterm.write('\r\n');
      } else if (domEvent.keyCode === 8) { // Backspace
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          xterm.write('\b \b');
        }
      } else if (domEvent.keyCode === 38) { // Up arrow
        if (commandHistory.length > 0) {
          const newIndex = historyIndex + 1;
          if (newIndex < commandHistory.length) {
            setHistoryIndex(newIndex);
            const command = commandHistory[commandHistory.length - 1 - newIndex];
            
            // Clear current input
            xterm.write('\r' + customPrompt);
            inputBuffer = command;
            xterm.write(command);
          }
        }
      } else if (domEvent.keyCode === 40) { // Down arrow
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          const command = commandHistory[commandHistory.length - 1 - newIndex];
          
          // Clear current input
          xterm.write('\r' + customPrompt);
          inputBuffer = command;
          xterm.write(command);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          xterm.write('\r' + customPrompt);
          inputBuffer = '';
        }
      } else if (domEvent.keyCode === 9) { // Tab
        // Tab completion (simplified)
        domEvent.preventDefault();
        if (inputBuffer.trim()) {
          requestTabCompletion(inputBuffer);
        }
      } else if (domEvent.ctrlKey && domEvent.keyCode === 67) { // Ctrl+C
        xterm.write('^C\r\n');
        xterm.write(customPrompt);
        inputBuffer = '';
      } else if (domEvent.ctrlKey && domEvent.keyCode === 76) { // Ctrl+L
        xterm.clear();
        xterm.write(customPrompt);
        inputBuffer = '';
      } else if (printable) {
        inputBuffer += key;
        xterm.write(key);
      }
      
      setCurrentInput(inputBuffer);
    });
    
    // Handle data output
    xterm.onData(data => {
      onOutput?.(data);
    });
    
    // Handle resize
    xterm.onResize(({ cols, rows }) => {
      // Handle terminal resize
      console.log(`Terminal resized to ${cols}x${rows}`);
    });
    
  }, [customPrompt, commandHistory, historyIndex, onOutput]);

  // Connect terminal to sandbox
  const connectToSandbox = useCallback((xterm: XTerm) => {
    if (!sandbox.isReady()) {
      xterm.write('Connecting to sandbox...\r\n');
      sandbox.onReady(() => {
        xterm.write('Connected to WebVM sandbox\r\n');
        xterm.write(customPrompt);
        setIsConnected(true);
      });
    } else {
      xterm.write('Connected to WebVM sandbox\r\n');
      xterm.write(customPrompt);
      setIsConnected(true);
    }
  }, [sandbox, customPrompt]);

  // Execute command
  const executeCommand = useCallback(async (command: string) => {
    if (!sandbox.isReady() || !xtermRef.current) return;
    
    setIsProcessing(true);
    onCommand?.(command);
    
    try {
      const xterm = xtermRef.current;
      
      // Handle built-in commands
      if (command === 'clear') {
        xterm.clear();
        xterm.write(customPrompt);
        setIsProcessing(false);
        return;
      }
      
      if (command === 'exit') {
        xterm.write('Goodbye!\r\n');
        setIsConnected(false);
        setIsProcessing(false);
        return;
      }
      
      // Parse command and arguments
      const parts = command.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);
      
      // Execute command in sandbox
      const result = await sandbox.executeCommand(cmd, args);
      
      // Write output
      if (result.stdout) {
        xterm.write(result.stdout.replace(/\n/g, '\r\n'));
      }
      
      if (result.stderr) {
        xterm.write('\r\n\x1b[31m' + result.stderr.replace(/\n/g, '\r\n') + '\x1b[0m');
      }
      
      // Show exit code if non-zero
      if (result.exitCode !== 0) {
        xterm.write(`\r\n\x1b[31m[Exit code: ${result.exitCode}]\x1b[0m`);
      }
      
      xterm.write('\r\n' + customPrompt);
      
    } catch (error) {
      const xterm = xtermRef.current;
      xterm.write('\r\n\x1b[31mError: ' + (error as Error).message + '\x1b[0m');
      xterm.write('\r\n' + customPrompt);
    } finally {
      setIsProcessing(false);
    }
  }, [sandbox, customPrompt, onCommand]);

  // Request tab completion
  const requestTabCompletion = useCallback(async (input: string) => {
    if (!sandbox.isReady() || !aiIntegration) return;
    
    try {
      const response = await sandbox.aiAssist(
        `Please suggest tab completion for this command: "${input}"`,
        { context: 'tab-completion', input }
      );
      
      if (response.type === 'text') {
        // Simple completion (in production, you'd parse the response)
        const suggestions = response.content.split('\n').filter(s => s.trim());
        if (suggestions.length > 0) {
          setAiSuggestions(suggestions);
          setShowAI(true);
        }
      }
    } catch (error) {
      console.error('Tab completion failed:', error);
    }
  }, [sandbox, aiIntegration]);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.write(customPrompt);
    }
  }, [customPrompt]);

  // Copy selection
  const copySelection = useCallback(() => {
    if (xtermRef.current) {
      const selection = xtermRef.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      }
    }
  }, []);

  // Resize terminal
  const resizeTerminal = useCallback(() => {
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }
  }, []);

  // Initialize terminal on mount
  useEffect(() => {
    initializeTerminal();
    
    // Cleanup on unmount
    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [initializeTerminal]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      resizeTerminal();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resizeTerminal]);

  // Handle theme changes
  useEffect(() => {
    if (xtermRef.current) {
      const newTheme = themes[theme || (systemTheme === 'dark' ? 'dark' : 'light')];
      xtermRef.current.options.theme = newTheme;
    }
  }, [theme, systemTheme, themes]);

  return (
    <Card className={cn('flex flex-col h-full', isMaximized && 'fixed inset-0 z-50', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4" />
            Terminal
            {isConnected && (
              <Badge variant="outline" className="ml-2">
                Connected
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="secondary" className="ml-2">
                Processing...
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {aiIntegration && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAI(!showAI)}
                disabled={!sandbox.isReady()}
              >
                <Bot className="h-4 w-4" />
                AI Help
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={copySelection}
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearTerminal}
            >
              <Trash2 className="h-4 w-4" />
              Clear
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
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative">
        <div 
          ref={terminalRef}
          className="h-full w-full"
          style={{ height, width }}
        />
        
        {showAI && aiSuggestions.length > 0 && (
          <div className="absolute top-4 right-4 w-80 bg-background border rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="text-sm font-medium">AI Suggestions</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAI(false)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-1">
              {aiSuggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="text-sm p-2 rounded bg-muted cursor-pointer hover:bg-muted/80"
                  onClick={() => {
                    if (xtermRef.current) {
                      xtermRef.current.write(suggestion);
                    }
                    setShowAI(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}