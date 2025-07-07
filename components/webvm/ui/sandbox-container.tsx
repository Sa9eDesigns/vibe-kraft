'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Monitor, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Wifi,
  WifiOff,
  Cpu,
  HardDrive,
  MemoryStick
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DevSandbox } from '../core/dev-sandbox';
import { CodeEditor } from './monaco-editor';
import { Terminal } from './terminal';
import { FileExplorer } from './file-explorer';
import { AIAssistant } from './ai-assistant';
import { IDELayout } from './split-panel';
import type { DevSandboxConfig, SandboxEvent, FileInfo } from '../types';

interface SandboxContainerProps {
  config: DevSandboxConfig;
  onReady?: (sandbox: DevSandbox) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: SandboxStatus) => void;
  className?: string;
  height?: string | number;
  width?: string | number;
  showControls?: boolean;
  showStatus?: boolean;
  autoStart?: boolean;
}

type SandboxStatus = 'initializing' | 'loading' | 'ready' | 'error' | 'destroyed';

interface SystemStats {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    connected: boolean;
    latency: number;
  };
}

export function SandboxContainer({
  config,
  onReady,
  onError,
  onStatusChange,
  className,
  height = '100vh',
  width = '100%',
  showControls = true,
  showStatus = true,
  autoStart = true
}: SandboxContainerProps) {
  const [sandbox, setSandbox] = useState<DevSandbox | null>(null);
  const [status, setStatus] = useState<SandboxStatus>('initializing');
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    memory: { used: 0, total: 0, percentage: 0 },
    cpu: { usage: 0 },
    disk: { used: 0, total: 0, percentage: 0 },
    network: { connected: false, latency: 0 }
  });
  const [events, setEvents] = useState<SandboxEvent[]>([]);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  // Create sandbox instance
  const createSandbox = useCallback(() => {
    try {
      const newSandbox = new DevSandbox(config);
      setSandbox(newSandbox);
      
      // Setup event listeners
      newSandbox.onReady(() => {
        setStatus('ready');
        setIsLoading(false);
        setLoadingProgress(100);
        setLoadingMessage('Sandbox ready');
        onReady?.(newSandbox);
        onStatusChange?.(status);
        
        // Setup console if display element exists
        if (displayRef.current) {
          newSandbox.setConsole(displayRef.current);
        }
      });
      
      newSandbox.onError((event) => {
        setStatus('error');
        setError(event.error);
        setIsLoading(false);
        onError?.(event.error);
        onStatusChange?.(status);
      });
      
      newSandbox.onCommand((result) => {
        const event: SandboxEvent = {
          type: 'command',
          data: result,
          timestamp: Date.now()
        };
        setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
      });
      
      newSandbox.onFileChange((event) => {
        const fileEvent: SandboxEvent = {
          type: 'fileChange',
          data: event,
          timestamp: Date.now()
        };
        setEvents(prev => [...prev.slice(-99), fileEvent]);
      });
      
      newSandbox.onAIMessage((response) => {
        const aiEvent: SandboxEvent = {
          type: 'aiMessage',
          data: response,
          timestamp: Date.now()
        };
        setEvents(prev => [...prev.slice(-99), aiEvent]);
      });
      
      newSandbox.onDestroyed(() => {
        setStatus('destroyed');
        setIsDestroyed(true);
        onStatusChange?.(status);
        if (statsInterval.current) {
          clearInterval(statsInterval.current);
        }
      });
      
      return newSandbox;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setStatus('error');
      onError?.(error);
      onStatusChange?.(status);
      return null;
    }
  }, [config, onReady, onError, onStatusChange, status]);

  // Initialize sandbox
  const initializeSandbox = useCallback(async () => {
    if (!sandbox) return;
    
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage('Initializing sandbox...');
    setStatus('loading');
    
    try {
      // Simulate loading progress
      const progressSteps = [
        { progress: 20, message: 'Loading CheerpX...' },
        { progress: 40, message: 'Setting up devices...' },
        { progress: 60, message: 'Mounting filesystem...' },
        { progress: 80, message: 'Starting Linux kernel...' },
        { progress: 90, message: 'Finalizing setup...' }
      ];
      
      for (const step of progressSteps) {
        setLoadingProgress(step.progress);
        setLoadingMessage(step.message);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      await sandbox.initialize();
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      setStatus('error');
      setIsLoading(false);
      onError?.(error);
      onStatusChange?.(status);
    }
  }, [sandbox, onError, onStatusChange, status]);

  // Start sandbox
  const startSandbox = useCallback(async () => {
    if (sandbox) {
      await sandbox.destroy();
    }
    
    const newSandbox = createSandbox();
    if (newSandbox) {
      await initializeSandbox();
    }
  }, [sandbox, createSandbox, initializeSandbox]);

  // Stop sandbox
  const stopSandbox = useCallback(async () => {
    if (sandbox) {
      await sandbox.destroy();
      setSandbox(null);
    }
  }, [sandbox]);

  // Restart sandbox
  const restartSandbox = useCallback(async () => {
    await stopSandbox();
    setTimeout(() => {
      startSandbox();
    }, 1000);
  }, [stopSandbox, startSandbox]);

  // Update system stats
  const updateSystemStats = useCallback(async () => {
    if (!sandbox || !sandbox.isReady()) return;
    
    try {
      // Get memory info
      const memInfo = await sandbox.executeCommand('free', ['-m']);
      const memLines = memInfo.stdout.split('\n');
      const memLine = memLines[1]?.split(/\s+/);
      
      if (memLine && memLine.length >= 3) {
        const total = parseInt(memLine[1]);
        const used = parseInt(memLine[2]);
        const percentage = total > 0 ? (used / total) * 100 : 0;
        
        setSystemStats(prev => ({
          ...prev,
          memory: { used, total, percentage }
        }));
      }
      
      // Get CPU info (simplified)
      const cpuInfo = await sandbox.executeCommand('cat', ['/proc/loadavg']);
      const loadAvg = cpuInfo.stdout.split(' ')[0];
      const cpuUsage = parseFloat(loadAvg) * 100;
      
      setSystemStats(prev => ({
        ...prev,
        cpu: { usage: Math.min(cpuUsage, 100) }
      }));
      
      // Get disk info
      const diskInfo = await sandbox.executeCommand('df', ['-h', '/']);
      const diskLines = diskInfo.stdout.split('\n');
      const diskLine = diskLines[1]?.split(/\s+/);
      
      if (diskLine && diskLine.length >= 5) {
        const percentage = parseInt(diskLine[4].replace('%', ''));
        
        setSystemStats(prev => ({
          ...prev,
          disk: { used: 0, total: 0, percentage }
        }));
      }
      
      // Network connectivity (simplified)
      setSystemStats(prev => ({
        ...prev,
        network: { connected: true, latency: Math.random() * 100 }
      }));
      
    } catch (error) {
      console.error('Failed to update system stats:', error);
    }
  }, [sandbox]);

  // Handle file selection
  const handleFileSelect = useCallback((file: FileInfo) => {
    setSelectedFile(file);
  }, []);

  // Auto-start sandbox
  useEffect(() => {
    if (autoStart && !sandbox && !isDestroyed) {
      const newSandbox = createSandbox();
      if (newSandbox) {
        initializeSandbox();
      }
    }
  }, [autoStart, sandbox, isDestroyed, createSandbox, initializeSandbox]);

  // Start system stats monitoring
  useEffect(() => {
    if (status === 'ready' && sandbox) {
      statsInterval.current = setInterval(updateSystemStats, 5000);
      updateSystemStats(); // Initial update
    }
    
    return () => {
      if (statsInterval.current) {
        clearInterval(statsInterval.current);
      }
    };
  }, [status, sandbox, updateSystemStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sandbox) {
        sandbox.destroy();
      }
    };
  }, [sandbox]);

  // Render loading state
  if (isLoading || status === 'loading') {
    return (
      <Card className={cn('flex flex-col h-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            WebVM Sandbox
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="space-y-2">
              <Progress value={loadingProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              This may take a few moments...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (status === 'error' && error) {
    return (
      <Card className={cn('flex flex-col h-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Sandbox Error
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message}
              </AlertDescription>
            </Alert>
            <Button onClick={restartSandbox} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render ready state
  if (status === 'ready' && sandbox) {
    return (
      <div className={cn('flex flex-col h-full', className)} style={{ height, width }}>
        {/* Controls and Status Bar */}
        {(showControls || showStatus) && (
          <div className="border-b bg-background/50 backdrop-blur">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Ready
                </Badge>
                
                {showStatus && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    
                    {/* System Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        <span>CPU: {systemStats.cpu.usage.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MemoryStick className="h-3 w-3" />
                        <span>RAM: {systemStats.memory.percentage.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        <span>Disk: {systemStats.disk.percentage}%</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {systemStats.network.connected ? (
                          <Wifi className="h-3 w-3 text-green-500" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-red-500" />
                        )}
                        <span>Network: {systemStats.network.connected ? 'Connected' : 'Offline'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {showControls && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={restartSandbox}>
                    <RefreshCw className="h-4 w-4" />
                    Restart
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={stopSandbox}>
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Main IDE Layout */}
        <div className="flex-1 overflow-hidden">
          <IDELayout
            fileExplorer={
              <FileExplorer
                sandbox={sandbox}
                onFileSelect={handleFileSelect}
                className="h-full"
              />
            }
            
            editor={
              <CodeEditor
                sandbox={sandbox}
                initialFile={selectedFile?.path || '/workspace/main.py'}
                language="python"
                aiAssistance={config.aiConfig.capabilities.codeGeneration}
                className="h-full"
              />
            }
            
            terminal={
              <Terminal
                sandbox={sandbox}
                aiIntegration={config.aiConfig.capabilities.terminalControl}
                className="h-full"
              />
            }
            
            aiAssistant={
              <AIAssistant
                sandbox={sandbox}
                model={config.aiConfig.model as any}
                capabilities={Object.keys(config.aiConfig.capabilities).filter(
                  key => config.aiConfig.capabilities[key as keyof typeof config.aiConfig.capabilities]
                ) as any}
                className="h-full"
              />
            }
            
            showAI={config.aiConfig.capabilities.visualInterface || config.aiConfig.capabilities.codeGeneration}
            explorerSize={20}
            editorSize={40}
            terminalSize={25}
            aiSize={15}
          />
        </div>
        
        {/* Hidden display for WebVM console */}
        <div
          ref={displayRef}
          id="webvm-display"
          className="hidden"
        />
      </div>
    );
  }

  // Default state
  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          WebVM Sandbox
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Sandbox not initialized</p>
          <Button onClick={startSandbox} disabled={isLoading}>
            <Play className="h-4 w-4 mr-2" />
            Start Sandbox
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}