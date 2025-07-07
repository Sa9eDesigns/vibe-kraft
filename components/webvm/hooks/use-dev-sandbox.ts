import { useState, useEffect, useCallback } from 'react';
import { DevSandbox } from '../core/dev-sandbox';
import type { DevSandboxConfig, SandboxEvent } from '../types';

export interface UseDevSandboxReturn {
  sandbox: DevSandbox | null;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  events: SandboxEvent[];
  
  // Actions
  initialize: () => Promise<void>;
  destroy: () => Promise<void>;
  restart: () => Promise<void>;
  
  // Event handlers
  onReady: (callback: (sandbox: DevSandbox) => void) => void;
  onError: (callback: (error: Error) => void) => void;
  onEvent: (callback: (event: SandboxEvent) => void) => void;
}

export function useDevSandbox(config: DevSandboxConfig): UseDevSandboxReturn {
  const [sandbox, setSandbox] = useState<DevSandbox | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<SandboxEvent[]>([]);

  // Event callbacks
  const [readyCallbacks, setReadyCallbacks] = useState<((sandbox: DevSandbox) => void)[]>([]);
  const [errorCallbacks, setErrorCallbacks] = useState<((error: Error) => void)[]>([]);
  const [eventCallbacks, setEventCallbacks] = useState<((event: SandboxEvent) => void)[]>([]);

  // Initialize sandbox
  const initialize = useCallback(async () => {
    if (sandbox) {
      await sandbox.destroy();
    }

    setIsLoading(true);
    setIsReady(false);
    setError(null);
    setEvents([]);

    try {
      const newSandbox = new DevSandbox(config);
      setSandbox(newSandbox);

      // Setup event listeners
      newSandbox.onReady((event) => {
        setIsReady(true);
        setIsLoading(false);
        readyCallbacks.forEach(callback => callback(newSandbox));
        
        const readyEvent: SandboxEvent = {
          type: 'ready',
          data: { sandbox: newSandbox },
          timestamp: Date.now()
        };
        setEvents(prev => [...prev, readyEvent]);
        eventCallbacks.forEach(callback => callback(readyEvent));
      });

      newSandbox.onError((event) => {
        setError(event.error);
        setIsLoading(false);
        setIsReady(false);
        errorCallbacks.forEach(callback => callback(event.error));
        
        const errorEvent: SandboxEvent = {
          type: 'error',
          data: { error: event.error },
          timestamp: Date.now()
        };
        setEvents(prev => [...prev, errorEvent]);
        eventCallbacks.forEach(callback => callback(errorEvent));
      });

      newSandbox.onCommand((result) => {
        const commandEvent: SandboxEvent = {
          type: 'command',
          data: result,
          timestamp: Date.now()
        };
        setEvents(prev => [...prev.slice(-99), commandEvent]); // Keep last 100 events
        eventCallbacks.forEach(callback => callback(commandEvent));
      });

      newSandbox.onFileChange((event) => {
        const fileEvent: SandboxEvent = {
          type: 'fileChange',
          data: event,
          timestamp: Date.now()
        };
        setEvents(prev => [...prev.slice(-99), fileEvent]);
        eventCallbacks.forEach(callback => callback(fileEvent));
      });

      newSandbox.onAIMessage((response) => {
        const aiEvent: SandboxEvent = {
          type: 'aiMessage',
          data: response,
          timestamp: Date.now()
        };
        setEvents(prev => [...prev.slice(-99), aiEvent]);
        eventCallbacks.forEach(callback => callback(aiEvent));
      });

      newSandbox.onDestroyed(() => {
        setIsReady(false);
        setSandbox(null);
      });

      await newSandbox.initialize();

    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      setIsReady(false);
      errorCallbacks.forEach(callback => callback(error));
      
      const errorEvent: SandboxEvent = {
        type: 'error',
        data: { error },
        timestamp: Date.now()
      };
      setEvents(prev => [...prev, errorEvent]);
      eventCallbacks.forEach(callback => callback(errorEvent));
    }
  }, [config, readyCallbacks, errorCallbacks, eventCallbacks, sandbox]);

  // Destroy sandbox
  const destroy = useCallback(async () => {
    if (sandbox) {
      await sandbox.destroy();
      setSandbox(null);
      setIsReady(false);
      setError(null);
    }
  }, [sandbox]);

  // Restart sandbox
  const restart = useCallback(async () => {
    await destroy();
    await initialize();
  }, [destroy, initialize]);

  // Event handler registration
  const onReady = useCallback((callback: (sandbox: DevSandbox) => void) => {
    setReadyCallbacks(prev => [...prev, callback]);
  }, []);

  const onError = useCallback((callback: (error: Error) => void) => {
    setErrorCallbacks(prev => [...prev, callback]);
  }, []);

  const onEvent = useCallback((callback: (event: SandboxEvent) => void) => {
    setEventCallbacks(prev => [...prev, callback]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sandbox) {
        sandbox.destroy();
      }
    };
  }, [sandbox]);

  return {
    sandbox,
    isLoading,
    isReady,
    error,
    events,
    initialize,
    destroy,
    restart,
    onReady,
    onError,
    onEvent
  };
}