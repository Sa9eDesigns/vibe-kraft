'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Settings, 
  Package,
  ChevronUp,
  ChevronDown,
  Copy,
  Download,
  Upload,
  Terminal as TerminalIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePyodide } from '../hooks/use-pyodide';

// Dynamic imports for xterm to avoid SSR issues
let XTerm: any = null;
let FitAddon: any = null;
let WebLinksAddon: any = null;
let SearchAddon: any = null;

// Load xterm dynamically
const loadXTerm = async () => {
  if (typeof window === 'undefined') return null;
  
  if (!XTerm) {
    const [xtermModule, fitModule, webLinksModule, searchModule] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('@xterm/addon-web-links'),
      import('@xterm/addon-search')
    ]);
    
    XTerm = xtermModule.Terminal;
    FitAddon = fitModule.FitAddon;
    WebLinksAddon = webLinksModule.WebLinksAddon;
    SearchAddon = searchModule.SearchAddon;
  }
  
  return { XTerm, FitAddon, WebLinksAddon, SearchAddon };
};

interface PyodideTerminalProps {
  workspaceId: string;
  className?: string;
  onCommand?: (command: string) => void;
  onOutput?: (output: string) => void;
}

export function PyodideTerminal({ 
  workspaceId,
  className = '', 
  onCommand,
  onOutput 
}: PyodideTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const { theme } = useTheme();
  
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPackageManager, setShowPackageManager] = useState(false);

  // Use Pyodide hook
  const {
    isInitialized,
    isLoading,
    error,
    runPython,
    output,
    clearOutput,
    installedPackages,
    installPackage,
    initialize
  } = usePyodide({
    workspaceId,
    autoInitialize: true
  });

  // Initialize terminal
  useEffect(() => {
    const initTerminal = async () => {
      if (!terminalRef.current) return;
      
      try {
        const xtermModules = await loadXTerm();
        if (!xtermModules) return;
        
        const { XTerm, FitAddon, WebLinksAddon, SearchAddon } = xtermModules;
        
        const xterm = new XTerm({
          theme: {
            background: theme === 'dark' ? '#0a0a0a' : '#ffffff',
            foreground: theme === 'dark' ? '#ffffff' : '#000000',
            cursor: theme === 'dark' ? '#ffffff' : '#000000',
            selection: theme === 'dark' ? '#3e3e3e' : '#d1d5db',
          },
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          fontSize: 14,
          cursorBlink: true,
          allowTransparency: true,
          convertEol: true,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const searchAddon = new SearchAddon();

        xterm.loadAddon(fitAddon);
        xterm.loadAddon(webLinksAddon);
        xterm.loadAddon(searchAddon);

        xterm.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        // Set up input handling
        setupInputHandling(xterm);

        setIsTerminalReady(true);
        
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
      }
    };

    initTerminal();

    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [theme]);

  // Setup input handling
  const setupInputHandling = (xterm: any) => {
    let currentLine = '';
    let cursorPosition = 0;

    const writePrompt = () => {
      xterm.write('\r\n>>> ');
      cursorPosition = 0;
      currentLine = '';
    };

    const updateLine = () => {
      // Clear current line and rewrite
      xterm.write('\r>>> ' + currentLine);
      // Move cursor to correct position
      const moveBack = currentLine.length - cursorPosition;
      if (moveBack > 0) {
        xterm.write('\x1b[' + moveBack + 'D');
      }
    };

    xterm.onData((data: string) => {
      if (isExecuting) return;

      const code = data.charCodeAt(0);

      if (code === 13) { // Enter
        if (currentLine.trim()) {
          executeCommand(currentLine.trim());
          setCommandHistory(prev => [...prev, currentLine.trim()]);
          setHistoryIndex(-1);
        } else {
          writePrompt();
        }
        currentLine = '';
        cursorPosition = 0;
      } else if (code === 127) { // Backspace
        if (cursorPosition > 0) {
          currentLine = currentLine.slice(0, cursorPosition - 1) + currentLine.slice(cursorPosition);
          cursorPosition--;
          updateLine();
        }
      } else if (code === 27) { // Escape sequences
        const seq = data.slice(1);
        if (seq === '[A') { // Up arrow
          if (historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            const historyCommand = commandHistory[commandHistory.length - 1 - newIndex];
            if (historyCommand) {
              currentLine = historyCommand;
              cursorPosition = currentLine.length;
              setHistoryIndex(newIndex);
              updateLine();
            }
          }
        } else if (seq === '[B') { // Down arrow
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const historyCommand = commandHistory[commandHistory.length - 1 - newIndex];
            currentLine = historyCommand || '';
            cursorPosition = currentLine.length;
            setHistoryIndex(newIndex);
            updateLine();
          } else if (historyIndex === 0) {
            currentLine = '';
            cursorPosition = 0;
            setHistoryIndex(-1);
            updateLine();
          }
        } else if (seq === '[C') { // Right arrow
          if (cursorPosition < currentLine.length) {
            cursorPosition++;
            xterm.write('\x1b[C');
          }
        } else if (seq === '[D') { // Left arrow
          if (cursorPosition > 0) {
            cursorPosition--;
            xterm.write('\x1b[D');
          }
        }
      } else if (code >= 32) { // Printable characters
        currentLine = currentLine.slice(0, cursorPosition) + data + currentLine.slice(cursorPosition);
        cursorPosition++;
        updateLine();
      }
    });

    // Initial prompt
    xterm.writeln('Python 3.11.0 (Pyodide)');
    xterm.writeln('Type "help", "copyright", "credits" or "license" for more information.');
    writePrompt();
  };

  // Execute Python command
  const executeCommand = async (command: string) => {
    if (!xtermRef.current || !isInitialized) return;

    setIsExecuting(true);
    setCurrentInput(command);
    onCommand?.(command);

    try {
      xtermRef.current.writeln('');
      
      // Handle special commands
      if (command === 'clear') {
        xtermRef.current.clear();
        xtermRef.current.write('>>> ');
        setIsExecuting(false);
        return;
      }

      if (command === 'help') {
        xtermRef.current.writeln('Available commands:');
        xtermRef.current.writeln('  clear - Clear the terminal');
        xtermRef.current.writeln('  exit() - Exit Python (restart session)');
        xtermRef.current.writeln('  help() - Python help system');
        xtermRef.current.writeln('  import micropip; await micropip.install("package") - Install packages');
        xtermRef.current.write('\r\n>>> ');
        setIsExecuting(false);
        return;
      }

      // Execute Python code
      const result = await runPython(command);
      
      // Display output
      if (result.output) {
        const lines = result.output.split('\n').filter(line => line.trim());
        lines.forEach(line => xtermRef.current.writeln(line));
      }

      // Display result if not None
      if (result.success && result.result !== undefined && result.result !== null) {
        xtermRef.current.writeln(String(result.result));
      }

      // Display errors
      if (!result.success && result.error) {
        xtermRef.current.writeln(`\x1b[31mError: ${result.error}\x1b[0m`);
      }

      if (result.stderr) {
        const lines = result.stderr.split('\n').filter(line => line.trim());
        lines.forEach(line => xtermRef.current.writeln(`\x1b[31m${line}\x1b[0m`));
      }

      onOutput?.(result.output || '');

    } catch (error) {
      xtermRef.current.writeln(`\x1b[31mError: ${error}\x1b[0m`);
    } finally {
      xtermRef.current.write('\r\n>>> ');
      setIsExecuting(false);
    }
  };

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

  // Clear terminal
  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.write('>>> ');
    }
    clearOutput();
  };

  // Restart Python session
  const handleRestart = async () => {
    if (xtermRef.current) {
      xtermRef.current.writeln('\r\nRestarting Python session...');
      await initialize();
      xtermRef.current.writeln('Python session restarted.');
      xtermRef.current.write('>>> ');
    }
  };

  // Copy terminal content
  const handleCopy = () => {
    if (xtermRef.current) {
      const selection = xtermRef.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      }
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Python Terminal</span>
          {isLoading && (
            <Badge variant="secondary" className="text-xs">
              Loading...
            </Badge>
          )}
          {isInitialized && (
            <Badge variant="default" className="text-xs">
              Ready
            </Badge>
          )}
          {error && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPackageManager(!showPackageManager)}
            className="h-7 w-7 p-0"
          >
            <Package className="h-3 w-3" />
          </Button>
          
          <Separator orientation="vertical" className="h-4" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 w-7 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 w-7 p-0"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestart}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <Play className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Package Manager Panel */}
      {showPackageManager && (
        <div className="p-3 border-b bg-muted/30">
          <div className="text-sm font-medium mb-2">Installed Packages</div>
          <div className="flex flex-wrap gap-1">
            {installedPackages.map((pkg) => (
              <Badge key={pkg.name} variant="outline" className="text-xs">
                {pkg.name} {pkg.version}
              </Badge>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Use: import micropip; await micropip.install("package-name")
          </div>
        </div>
      )}

      {/* Terminal Content */}
      <div className="flex-1 relative">
        {!isTerminalReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <TerminalIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
              <div className="text-sm text-muted-foreground">
                {isLoading ? 'Loading Python environment...' : 'Initializing terminal...'}
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-sm text-destructive">
                Failed to initialize Python environment
              </div>
              <div className="text-xs text-muted-foreground">
                {error}
              </div>
              <Button size="sm" onClick={initialize}>
                Retry
              </Button>
            </div>
          </div>
        )}

        <div 
          ref={terminalRef} 
          className="h-full w-full p-2"
          style={{ 
            opacity: isTerminalReady && !error ? 1 : 0,
            pointerEvents: isTerminalReady && !error ? 'auto' : 'none'
          }}
        />
      </div>
    </div>
  );
}
