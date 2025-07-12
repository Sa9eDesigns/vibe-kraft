/**
 * React hook for SSH terminal integration
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { SSHTerminal, SSHTerminalOptions } from '../terminal';
import { SSHClient } from '../client';
import { SSHTerminalConfig } from '../types';
import { createSSHError } from '../errors';

export interface UseSSHTerminalOptions extends SSHTerminalOptions {
  autoConnect?: boolean;
  autoResize?: boolean;
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  onKey?: (key: string, event: KeyboardEvent) => void;
  onSelection?: (text: string) => void;
  onTitle?: (title: string) => void;
  onBell?: () => void;
  onError?: (error: Error) => void;
}

export interface UseSSHTerminalReturn {
  // Terminal instance
  terminal: SSHTerminal | null;
  
  // Terminal state
  isAttached: boolean;
  isConnected: boolean;
  dimensions: { cols: number; rows: number } | null;
  
  // Terminal actions
  attach: (container: HTMLElement) => void;
  detach: () => void;
  connect: (terminalConfig?: SSHTerminalConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Terminal operations
  write: (data: string) => void;
  writeln: (data: string) => void;
  clear: () => void;
  reset: () => void;
  fit: () => void;
  resize: (cols: number, rows: number) => void;
  focus: () => void;
  
  // Selection and clipboard
  getSelection: () => string;
  selectAll: () => void;
  copySelection: () => Promise<void>;
  paste: () => Promise<void>;
  
  // Error state
  error: Error | null;
}

export function useSSHTerminal(
  sshClient: SSHClient | null,
  options: UseSSHTerminalOptions = {}
): UseSSHTerminalReturn {
  const [terminal, setTerminal] = useState<SSHTerminal | null>(null);
  const [isAttached, setIsAttached] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [dimensions, setDimensions] = useState<{ cols: number; rows: number } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const containerRef = useRef<HTMLElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const {
    autoConnect = false,
    autoResize = true,
    onData,
    onResize,
    onKey,
    onSelection,
    onTitle,
    onBell,
    onError,
    ...terminalOptions
  } = options;

  // Create terminal instance when SSH client is available
  useEffect(() => {
    if (sshClient && !terminal) {
      try {
        const newTerminal = new SSHTerminal(sshClient, terminalOptions);
        setTerminal(newTerminal);
        setError(null);
      } catch (err) {
        const terminalError = createSSHError(
          `Failed to create terminal: ${err}`,
          'TERMINAL_CREATION_ERROR'
        );
        setError(terminalError);
        onError?.(terminalError);
      }
    } else if (!sshClient && terminal) {
      // Clean up terminal when SSH client is removed
      terminal.detach();
      setTerminal(null);
      setIsAttached(false);
      setIsConnected(false);
      setDimensions(null);
    }
  }, [sshClient, terminal, terminalOptions, onError]);

  // Set up terminal event handlers
  useEffect(() => {
    if (!terminal) return;

    const handleData = (data: string) => {
      onData?.(data);
    };

    const handleResize = (cols: number, rows: number) => {
      setDimensions({ cols, rows });
      onResize?.(cols, rows);
    };

    const handleKey = (key: string, event: KeyboardEvent) => {
      onKey?.(key, event);
    };

    const handleSelection = (text: string) => {
      onSelection?.(text);
    };

    const handleTitle = (title: string) => {
      onTitle?.(title);
    };

    const handleBell = () => {
      onBell?.();
    };

    const handleError = (err: Error) => {
      setError(err);
      onError?.(err);
    };

    terminal.on('data', handleData);
    terminal.on('resize', handleResize);
    terminal.on('key', handleKey);
    terminal.on('selection', handleSelection);
    terminal.on('title', handleTitle);
    terminal.on('bell', handleBell);
    terminal.on('error', handleError);

    return () => {
      terminal.removeListener('data', handleData);
      terminal.removeListener('resize', handleResize);
      terminal.removeListener('key', handleKey);
      terminal.removeListener('selection', handleSelection);
      terminal.removeListener('title', handleTitle);
      terminal.removeListener('bell', handleBell);
      terminal.removeListener('error', handleError);
    };
  }, [terminal, onData, onResize, onKey, onSelection, onTitle, onBell, onError]);

  // Attach terminal to container
  const attach = useCallback((container: HTMLElement) => {
    if (!terminal) {
      throw createSSHError('Terminal not initialized', 'TERMINAL_NOT_INITIALIZED');
    }

    try {
      terminal.attach(container);
      containerRef.current = container;
      setIsAttached(true);
      setError(null);

      // Set up auto-resize if enabled
      if (autoResize && window.ResizeObserver) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setTimeout(() => {
            terminal.fit();
          }, 100);
        });
        resizeObserverRef.current.observe(container);
      }

      // Get initial dimensions
      const dims = terminal.getDimensions();
      setDimensions(dims);

    } catch (err) {
      const attachError = createSSHError(
        `Failed to attach terminal: ${err}`,
        'TERMINAL_ATTACH_ERROR'
      );
      setError(attachError);
      throw attachError;
    }
  }, [terminal, autoResize]);

  // Detach terminal from container
  const detach = useCallback(() => {
    if (!terminal) return;

    try {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      terminal.detach();
      containerRef.current = null;
      setIsAttached(false);
      setIsConnected(false);
      setDimensions(null);
      setError(null);
    } catch (err) {
      const detachError = createSSHError(
        `Failed to detach terminal: ${err}`,
        'TERMINAL_DETACH_ERROR'
      );
      setError(detachError);
    }
  }, [terminal]);

  // Connect terminal to SSH shell
  const connect = useCallback(async (terminalConfig?: SSHTerminalConfig) => {
    if (!terminal) {
      throw createSSHError('Terminal not initialized', 'TERMINAL_NOT_INITIALIZED');
    }

    if (!isAttached) {
      throw createSSHError('Terminal not attached to container', 'TERMINAL_NOT_ATTACHED');
    }

    try {
      await terminal.connect(terminalConfig);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const connectError = createSSHError(
        `Failed to connect terminal: ${err}`,
        'TERMINAL_CONNECT_ERROR'
      );
      setError(connectError);
      throw connectError;
    }
  }, [terminal, isAttached]);

  // Disconnect terminal from SSH shell
  const disconnect = useCallback(async () => {
    if (!terminal) return;

    try {
      await terminal.disconnect();
      setIsConnected(false);
      setError(null);
    } catch (err) {
      const disconnectError = createSSHError(
        `Failed to disconnect terminal: ${err}`,
        'TERMINAL_DISCONNECT_ERROR'
      );
      setError(disconnectError);
    }
  }, [terminal]);

  // Auto-connect when terminal is attached and SSH client is ready
  useEffect(() => {
    if (autoConnect && terminal && isAttached && sshClient?.isReady && !isConnected) {
      connect().catch(() => {
        // Error is already handled in connect function
      });
    }
  }, [autoConnect, terminal, isAttached, sshClient?.isReady, isConnected, connect]);

  // Terminal operation functions
  const write = useCallback((data: string) => {
    terminal?.write(data);
  }, [terminal]);

  const writeln = useCallback((data: string) => {
    terminal?.writeln(data);
  }, [terminal]);

  const clear = useCallback(() => {
    terminal?.clear();
  }, [terminal]);

  const reset = useCallback(() => {
    terminal?.reset();
  }, [terminal]);

  const fit = useCallback(() => {
    terminal?.fit();
  }, [terminal]);

  const resize = useCallback((cols: number, rows: number) => {
    terminal?.resize(cols, rows);
  }, [terminal]);

  const focus = useCallback(() => {
    terminal?.focus();
  }, [terminal]);

  const getSelection = useCallback(() => {
    return terminal?.getSelection() || '';
  }, [terminal]);

  const selectAll = useCallback(() => {
    terminal?.selectAll();
  }, [terminal]);

  const copySelection = useCallback(async () => {
    if (terminal) {
      await terminal.copySelection();
    }
  }, [terminal]);

  const paste = useCallback(async () => {
    if (terminal) {
      await terminal.paste();
    }
  }, [terminal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (terminal) {
        terminal.detach();
      }
    };
  }, [terminal]);

  return {
    terminal,
    isAttached,
    isConnected,
    dimensions,
    attach,
    detach,
    connect,
    disconnect,
    write,
    writeln,
    clear,
    reset,
    fit,
    resize,
    focus,
    getSelection,
    selectAll,
    copySelection,
    paste,
    error
  };
}
