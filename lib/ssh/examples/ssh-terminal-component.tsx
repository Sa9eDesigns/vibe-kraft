/**
 * Example SSH Terminal Component
 * Demonstrates integration with existing WebVM terminal patterns
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Terminal, 
  Power, 
  PowerOff, 
  RotateCcw, 
  Settings, 
  Copy,
  Download,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useSSHConnection, useSSHTerminal, SSHConnectionConfig } from '@vibe-kraft/ssh';

interface SSHTerminalComponentProps {
  config: SSHConnectionConfig;
  className?: string;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

export function SSHTerminalComponent({
  config,
  className,
  onConnectionChange,
  onError
}: SSHTerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [terminalTitle, setTerminalTitle] = useState('SSH Terminal');

  // SSH connection hook
  const {
    client,
    state,
    isReady,
    error: connectionError,
    connect,
    disconnect,
    reconnect,
    connectionInfo
  } = useSSHConnection(config, {
    autoConnect: true,
    onStateChange: (newState) => {
      console.log('SSH state changed:', newState);
    },
    onConnect: () => {
      onConnectionChange?.(true);
    },
    onDisconnect: () => {
      onConnectionChange?.(false);
    },
    onError: (error) => {
      console.error('SSH connection error:', error);
      onError?.(error);
    }
  });

  // SSH terminal hook
  const {
    terminal,
    isAttached,
    isConnected: terminalConnected,
    dimensions,
    attach,
    detach,
    connect: connectTerminal,
    disconnect: disconnectTerminal,
    clear,
    fit,
    copySelection,
    error: terminalError
  } = useSSHTerminal(client, {
    autoConnect: true,
    autoResize: true,
    theme: 'dark',
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    onTitle: (title) => {
      setTerminalTitle(title || 'SSH Terminal');
    },
    onError: (error) => {
      console.error('SSH terminal error:', error);
      onError?.(error);
    }
  });

  // Attach terminal when ref is available
  useEffect(() => {
    if (terminalRef.current && terminal && !isAttached) {
      attach(terminalRef.current);
    }
  }, [terminal, attach, isAttached]);

  // Handle connection/disconnection
  const handleConnect = async () => {
    try {
      if (!isReady) {
        await connect();
      }
      if (!terminalConnected) {
        await connectTerminal();
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectTerminal();
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleReconnect = async () => {
    try {
      await reconnect();
      if (terminal && isAttached) {
        await connectTerminal();
      }
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  };

  const handleClear = () => {
    clear();
  };

  const handleCopy = async () => {
    try {
      await copySelection();
    } catch (error) {
      console.error('Failed to copy selection:', error);
    }
  };

  const handleFit = () => {
    fit();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Fit terminal after fullscreen toggle
    setTimeout(() => {
      fit();
    }, 100);
  };

  const getStatusColor = () => {
    switch (state) {
      case 'ready':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (terminalConnected && isReady) {
      return 'Connected';
    }
    switch (state) {
      case 'connecting':
        return 'Connecting...';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return state;
    }
  };

  const error = connectionError || terminalError;

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <CardTitle className="text-lg">{terminalTitle}</CardTitle>
            <Badge variant="outline" className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span>{getStatusText()}</span>
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Connection Controls */}
            {!isReady ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleConnect}
                disabled={state === 'connecting'}
              >
                <Power className="h-4 w-4 mr-1" />
                Connect
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
              >
                <PowerOff className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleReconnect}
              disabled={state === 'connecting'}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Terminal Controls */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={!terminalConnected}
            >
              Clear
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={!terminalConnected}
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleFit}
              disabled={!terminalConnected}
            >
              Fit
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Connection Info */}
        {connectionInfo && (
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{connectionInfo.username}@{connectionInfo.host}:{connectionInfo.port}</span>
            {dimensions && (
              <span>{dimensions.cols}×{dimensions.rows}</span>
            )}
            {connectionInfo.connectedAt && (
              <span>Connected: {connectionInfo.connectedAt.toLocaleTimeString()}</span>
            )}
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
            {error.message}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={terminalRef}
          className={`bg-black ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'} w-full`}
          style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '384px' }}
        />
      </CardContent>
    </Card>
  );
}
