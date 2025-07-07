import { useState, useCallback, useRef, useEffect } from 'react';
import type { DevSandbox } from '../core/dev-sandbox';
import type { CommandResult } from '../types';

export interface UseTerminalReturn {
  // Terminal state
  isConnected: boolean;
  isProcessing: boolean;
  output: string[];
  commandHistory: string[];
  currentInput: string;
  
  // Terminal actions
  executeCommand: (command: string) => Promise<CommandResult>;
  sendInput: (input: string) => void;
  clearTerminal: () => void;
  clearHistory: () => void;
  
  // History navigation
  historyIndex: number;
  navigateHistory: (direction: 'up' | 'down') => void;
  getHistoryCommand: (index: number) => string | undefined;
  
  // Terminal control
  interrupt: () => Promise<void>;
  reset: () => Promise<void>;
  
  // Output management
  addOutput: (text: string, type?: 'stdout' | 'stderr' | 'info') => void;
  getLastOutput: () => string;
  exportOutput: () => string;
  
  // Settings
  prompt: string;
  setPrompt: (prompt: string) => void;
  workingDirectory: string;
  setWorkingDirectory: (dir: string) => void;
  
  // Environment
  environment: Record<string, string>;
  setEnvironmentVariable: (key: string, value: string) => void;
  removeEnvironmentVariable: (key: string) => void;
  
  // Process management
  runningProcesses: Map<string, any>;
  killProcess: (pid: string) => Promise<void>;
  listProcesses: () => Promise<any[]>;
}

interface OutputLine {
  id: string;
  timestamp: Date;
  content: string;
  type: 'stdout' | 'stderr' | 'info' | 'command';
}

export function useTerminal(
  sandbox: DevSandbox,
  initialPrompt: string = 'user@webvm:~$ '
): UseTerminalReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [workingDirectory, setWorkingDirectory] = useState('/home/user');
  const [environment, setEnvironment] = useState<Record<string, string>>({
    HOME: '/home/user',
    USER: 'user',
    SHELL: '/bin/bash',
    TERM: 'xterm-256color',
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
  });
  const [runningProcesses, setRunningProcesses] = useState<Map<string, any>>(new Map());
  
  const abortController = useRef<AbortController | null>(null);

  // Add output function (defined early for use in other callbacks)
  const addOutput = useCallback((text: string, type: 'stdout' | 'stderr' | 'info' | 'command' = 'stdout') => {
    const lines = text.split('\n').filter(line => line !== '');
    const newOutputLines: OutputLine[] = lines.map(line => ({
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      content: line,
      type
    }));
    
    setOutput(prev => [...prev.slice(-999), ...newOutputLines]); // Keep last 1000 lines
  }, []);

  // Execute command
  const executeCommand = useCallback(async (command: string): Promise<CommandResult> => {
    if (!sandbox?.isReady()) {
      throw new Error('Terminal is not connected');
    }

    if (!command.trim()) {
      return {
        command: '',
        exitCode: 0,
        stdout: '',
        stderr: '',
        duration: 0,
        timestamp: new Date()
      };
    }

    setIsProcessing(true);
    
    // Add command to output
    addOutput(`${prompt}${command}`, 'command');
    
    // Add to history if not duplicate
    if (commandHistory[commandHistory.length - 1] !== command) {
      setCommandHistory(prev => [...prev, command]);
    }
    setHistoryIndex(-1);

    try {
      // Create abort controller for this command
      abortController.current = new AbortController();
      
      // Parse command and arguments
      const parts = command.trim().split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);
      
      // Handle built-in commands
      if (cmd === 'clear') {
        clearTerminal();
        return {
          command,
          exitCode: 0,
          stdout: '',
          stderr: '',
          duration: 0,
          timestamp: new Date()
        };
      }
      
      if (cmd === 'cd') {
        const newDir = args[0] || environment.HOME;
        try {
          // Test if directory exists
          await sandbox.executeCommand('test', ['-d', newDir]);
          setWorkingDirectory(newDir);
          setPrompt(`user@webvm:${newDir}$ `);
          
          return {
            command,
            exitCode: 0,
            stdout: '',
            stderr: '',
            duration: 0,
            timestamp: new Date()
          };
        } catch (error) {
          const result: CommandResult = {
            command,
            exitCode: 1,
            stdout: '',
            stderr: `cd: ${newDir}: No such file or directory`,
            duration: 0,
            timestamp: new Date()
          };
          
          addOutput(result.stderr, 'stderr');
          return result;
        }
      }
      
      if (cmd === 'pwd') {
        const result: CommandResult = {
          command,
          exitCode: 0,
          stdout: workingDirectory,
          stderr: '',
          duration: 0,
          timestamp: new Date()
        };
        
        addOutput(result.stdout, 'stdout');
        return result;
      }
      
      if (cmd === 'export') {
        if (args.length > 0) {
          const envVar = args[0];
          const [key, value] = envVar.split('=');
          if (key && value) {
            setEnvironmentVariable(key, value);
          }
        }
        
        return {
          command,
          exitCode: 0,
          stdout: '',
          stderr: '',
          duration: 0,
          timestamp: new Date()
        };
      }
      
      if (cmd === 'env') {
        const envOutput = Object.entries(environment)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');
        
        const result: CommandResult = {
          command,
          exitCode: 0,
          stdout: envOutput,
          stderr: '',
          duration: 0,
          timestamp: new Date()
        };
        
        addOutput(result.stdout, 'stdout');
        return result;
      }
      
      // Execute command in sandbox
      const envArray = Object.entries(environment).map(([key, value]) => `${key}=${value}`);
      
      const result = await sandbox.executeCommand(cmd, args, {
        env: envArray,
        cwd: workingDirectory,
        uid: 1000,
        gid: 1000
      });
      
      // Add output to terminal
      if (result.stdout) {
        addOutput(result.stdout, 'stdout');
      }
      
      if (result.stderr) {
        addOutput(result.stderr, 'stderr');
      }
      
      return result;
      
    } catch (error) {
      const result: CommandResult = {
        command,
        exitCode: 1,
        stdout: '',
        stderr: (error as Error).message,
        duration: 0,
        timestamp: new Date()
      };
      
      addOutput(result.stderr, 'stderr');
      throw error;
      
    } finally {
      setIsProcessing(false);
      abortController.current = null;
    }
  }, [sandbox, prompt, commandHistory, workingDirectory, environment]);

  // Send input
  const sendInput = useCallback((input: string) => {
    setCurrentInput(input);
  }, []);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    setOutput([]);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setCommandHistory([]);
    setHistoryIndex(-1);
  }, []);

  // Navigate history
  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up') {
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else {
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setCurrentInput('');
      }
    }
  }, [historyIndex, commandHistory]);

  // Get history command
  const getHistoryCommand = useCallback((index: number): string | undefined => {
    return commandHistory[index];
  }, [commandHistory]);

  // Interrupt current command
  const interrupt = useCallback(async () => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setIsProcessing(false);
    addOutput('^C', 'info');
  }, []);

  // Reset terminal
  const reset = useCallback(async () => {
    await interrupt();
    clearTerminal();
    setWorkingDirectory('/home/user');
    setPrompt(initialPrompt);
    setCurrentInput('');
    setHistoryIndex(-1);
  }, [interrupt, initialPrompt]);



  // Get last output
  const getLastOutput = useCallback((): string => {
    const lastLine = output[output.length - 1];
    return lastLine ? lastLine.content : '';
  }, [output]);

  // Export output
  const exportOutput = useCallback((): string => {
    return output.map(line => {
      const timestamp = line.timestamp.toLocaleTimeString();
      const prefix = line.type === 'command' ? '' : `[${timestamp}] `;
      return `${prefix}${line.content}`;
    }).join('\n');
  }, [output]);

  // Set environment variable
  const setEnvironmentVariable = useCallback((key: string, value: string) => {
    setEnvironment(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Remove environment variable
  const removeEnvironmentVariable = useCallback((key: string) => {
    setEnvironment(prev => {
      const newEnv = { ...prev };
      delete newEnv[key];
      return newEnv;
    });
  }, []);

  // Kill process
  const killProcess = useCallback(async (pid: string) => {
    if (!sandbox?.isReady()) {
      throw new Error('Terminal is not connected');
    }

    try {
      await sandbox.executeCommand('kill', [pid]);
      setRunningProcesses(prev => {
        const newProcesses = new Map(prev);
        newProcesses.delete(pid);
        return newProcesses;
      });
    } catch (error) {
      console.error('Failed to kill process:', error);
      throw error;
    }
  }, [sandbox]);

  // List processes
  const listProcesses = useCallback(async (): Promise<any[]> => {
    if (!sandbox?.isReady()) {
      throw new Error('Terminal is not connected');
    }

    try {
      const result = await sandbox.executeCommand('ps', ['aux']);
      const lines = result.stdout.split('\n').slice(1); // Skip header
      
      return lines.filter(line => line.trim()).map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          user: parts[0],
          pid: parts[1],
          cpu: parts[2],
          mem: parts[3],
          vsz: parts[4],
          rss: parts[5],
          tty: parts[6],
          stat: parts[7],
          start: parts[8],
          time: parts[9],
          command: parts.slice(10).join(' ')
        };
      });
    } catch (error) {
      console.error('Failed to list processes:', error);
      throw error;
    }
  }, [sandbox]);

  // Check connection status
  useEffect(() => {
    if (sandbox?.isReady()) {
      setIsConnected(true);
      addOutput('Terminal connected to WebVM', 'info');
      addOutput(prompt, 'command');
    } else {
      setIsConnected(false);
    }
  }, [sandbox, prompt, addOutput]);

  return {
    // Terminal state
    isConnected,
    isProcessing,
    output: output.map(line => line.content),
    commandHistory,
    currentInput,
    
    // Terminal actions
    executeCommand,
    sendInput,
    clearTerminal,
    clearHistory,
    
    // History navigation
    historyIndex,
    navigateHistory,
    getHistoryCommand,
    
    // Terminal control
    interrupt,
    reset,
    
    // Output management
    addOutput,
    getLastOutput,
    exportOutput,
    
    // Settings
    prompt,
    setPrompt,
    workingDirectory,
    setWorkingDirectory,
    
    // Environment
    environment,
    setEnvironmentVariable,
    removeEnvironmentVariable,
    
    // Process management
    runningProcesses,
    killProcess,
    listProcesses
  };
}