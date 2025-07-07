import { useState, useCallback, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import type { DevSandbox } from '../core/dev-sandbox';
import type { AIMessage } from '../types';

export interface UseAIAssistantReturn {
  // Chat state
  messages: AIMessage[];
  isLoading: boolean;
  error: Error | null;
  
  // Chat actions
  sendMessage: (message: string, context?: any) => Promise<void>;
  clearChat: () => void;
  regenerateResponse: () => Promise<void>;
  stopGeneration: () => void;
  
  // AI capabilities
  executeCommand: (command: string) => Promise<any>;
  analyzeCode: (code: string, language: string) => Promise<string>;
  generateCode: (prompt: string, language: string) => Promise<string>;
  debugCode: (code: string, error: string) => Promise<string>;
  takeScreenshot: () => Promise<string>;
  
  // Context management
  setContext: (context: string) => void;
  addContext: (key: string, value: any) => void;
  clearContext: () => void;
  
  // Settings
  temperature: number;
  setTemperature: (temp: number) => void;
  maxTokens: number;
  setMaxTokens: (tokens: number) => void;
}

export function useAIAssistant(
  sandbox: DevSandbox | null,
  model: string = 'gpt-4',
  capabilities: string[] = []
): UseAIAssistantReturn {
  const [context, setContextState] = useState<Record<string, any>>({});
  const [currentContext, setCurrentContext] = useState('general');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const chatIdRef = useRef<string>(`chat-${Date.now()}`);

  // Initialize chat with system prompt
  const systemPrompt = `You are an AI assistant helping with development tasks in a WebVM environment.
  
Available capabilities: ${capabilities.join(', ')}
Current context: ${currentContext}

You have access to the following tools:
- Terminal commands (bash tool)
- File system operations (read/write/list files)
- Code generation and analysis
- Visual interface control (screenshots, mouse, keyboard)
- Debugging assistance

Be helpful, precise, and always confirm before executing potentially destructive operations.
When writing code, consider the user's context and provide complete, working solutions.
If you need more information, ask specific questions.`;

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
    setMessages
  } = useChat({
    api: '/api/ai/chat',
    id: chatIdRef.current,
    initialMessages: [
      {
        id: 'system',
        role: 'system',
        content: systemPrompt
      }
    ],
    body: {
      model,
      temperature,
      maxTokens,
      context: {
        ...context,
        currentContext,
        sandboxReady: sandbox?.isReady() || false,
        capabilities
      }
    },
    onError: (error) => {
      console.error('AI Chat Error:', error);
    },
    onFinish: (message) => {
      // Convert to our AI message format
      const aiMessage: AIMessage = {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: new Date(),
        type: 'text'
      };
      setAiMessages(prev => [...prev, aiMessage]);
    }
  });

  // Send message
  const sendMessage = useCallback(async (message: string, additionalContext?: any) => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      type: 'text',
      metadata: additionalContext
    };

    setAiMessages(prev => [...prev, userMessage]);

    // Update context with additional context
    if (additionalContext) {
      setContextState(prev => ({ ...prev, ...additionalContext }));
    }
    
    try {
      // Use the input value and submit properly
      const event = {
        preventDefault: () => {},
        target: {
          value: message
        }
      } as React.FormEvent<HTMLFormElement>;

      // Set the input value first
      handleInputChange({
        target: { value: message }
      } as React.ChangeEvent<HTMLInputElement>);

      // Then submit
      await handleSubmit(event);
    } catch (error) {
      // Remove the user message if submission fails
      setAiMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      throw error;
    }

  }, [sandbox, context, handleSubmit, handleInputChange]);

  // Clear chat
  const clearChat = useCallback(() => {
    setAiMessages([]);
    // Clear the chat messages using setMessages from useChat
    setMessages([
      {
        id: 'system',
        role: 'system',
        content: systemPrompt
      }
    ]);
    // Generate new chat ID to ensure fresh session
    chatIdRef.current = `chat-${Date.now()}`;
  }, [setMessages, systemPrompt]);

  // Regenerate response
  const regenerateResponse = useCallback(async () => {
    if (isLoading) return;
    await reload();
  }, [isLoading, reload]);

  // Stop generation
  const stopGeneration = useCallback(() => {
    stop();
  }, [stop]);

  // Execute command through AI
  const executeCommand = useCallback(async (command: string): Promise<any> => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    if (!command.trim()) {
      throw new Error('Command cannot be empty');
    }

    const response = await sandbox.aiAssist(
      `Please execute this command: ${command}`,
      { 
        type: 'command-execution',
        command,
        context: currentContext
      }
    );

    return response;
  }, [sandbox, currentContext]);

  // Analyze code
  const analyzeCode = useCallback(async (code: string, language: string): Promise<string> => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    if (!code.trim()) {
      throw new Error('Code cannot be empty');
    }

    if (!language.trim()) {
      throw new Error('Language must be specified');
    }

    const response = await sandbox.aiAssist(
      `Please analyze this ${language} code and provide insights, suggestions, and potential improvements:\n\n${code}`,
      {
        type: 'code-analysis',
        code,
        language,
        context: currentContext
      }
    );

    return response.content;
  }, [sandbox, currentContext]);

  // Generate code
  const generateCode = useCallback(async (prompt: string, language: string): Promise<string> => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    if (!language.trim()) {
      throw new Error('Language must be specified');
    }

    const response = await sandbox.aiAssist(
      `Please generate ${language} code for the following requirements:\n\n${prompt}`,
      {
        type: 'code-generation',
        prompt,
        language,
        context: currentContext
      }
    );

    return response.content;
  }, [sandbox, currentContext]);

  // Debug code
  const debugCode = useCallback(async (code: string, error: string): Promise<string> => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    if (!code.trim()) {
      throw new Error('Code cannot be empty');
    }

    if (!error.trim()) {
      throw new Error('Error message cannot be empty');
    }

    const response = await sandbox.aiAssist(
      `Please help debug this code. Here's the code:\n\n${code}\n\nAnd here's the error:\n\n${error}`,
      {
        type: 'code-debugging',
        code,
        error,
        context: currentContext
      }
    );

    return response.content;
  }, [sandbox, currentContext]);

  // Take screenshot
  const takeScreenshot = useCallback(async (): Promise<string> => {
    if (!sandbox?.isReady()) {
      throw new Error('Sandbox is not ready');
    }

    if (!capabilities.includes('visual')) {
      throw new Error('Visual capabilities not enabled');
    }

    const response = await sandbox.aiAssist(
      'Please take a screenshot of the current desktop',
      {
        type: 'screenshot',
        context: currentContext
      }
    );

    return response.content;
  }, [sandbox, currentContext, capabilities]);

  // Set context
  const setContext = useCallback((newContext: string) => {
    setCurrentContext(newContext);
    
    // Send context change message
    const contextMessage: AIMessage = {
      id: `context-${Date.now()}`,
      role: 'system',
      content: `Context changed to: ${newContext}`,
      timestamp: new Date(),
      type: 'text'
    };
    
    setAiMessages(prev => [...prev, contextMessage]);
  }, []);

  // Add context
  const addContext = useCallback((key: string, value: any) => {
    setContextState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Clear context
  const clearContext = useCallback(() => {
    setContextState({});
  }, []);

  // Update context when sandbox state changes
  useEffect(() => {
    if (sandbox) {
      addContext('sandboxReady', sandbox.isReady());
      addContext('sandboxConfig', sandbox.getConfig());
    }
  }, [sandbox, addContext]);

  // Enhanced temperature setter with validation
  const setTemperatureWithValidation = useCallback((temp: number) => {
    if (temp < 0 || temp > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    setTemperature(temp);
  }, []);

  // Enhanced maxTokens setter with validation
  const setMaxTokensWithValidation = useCallback((tokens: number) => {
    if (tokens < 1 || tokens > 100000) {
      throw new Error('Max tokens must be between 1 and 100000');
    }
    setMaxTokens(tokens);
  }, []);

  // Convert useChat messages to our format
  const convertedMessages: AIMessage[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    timestamp: new Date(),
    type: 'text'
  }));

  return {
    // Chat state
    messages: convertedMessages,
    isLoading,
    error,
    
    // Chat actions
    sendMessage,
    clearChat,
    regenerateResponse,
    stopGeneration,
    
    // AI capabilities
    executeCommand,
    analyzeCode,
    generateCode,
    debugCode,
    takeScreenshot,
    
    // Context management
    setContext,
    addContext,
    clearContext,
    
    // Settings
    temperature,
    setTemperature: setTemperatureWithValidation,
    maxTokens,
    setMaxTokens: setMaxTokensWithValidation
  };
}