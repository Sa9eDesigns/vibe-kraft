// Core WebVM Components
export { DevSandbox } from './core/dev-sandbox';
export { SandboxContainer } from './ui/sandbox-container';
export { CodeEditor } from './ui/monaco-editor';
export { Terminal } from './ui/terminal';
export { FileExplorer } from './ui/file-explorer';
export { AIAssistant } from './ui/ai-assistant';
export { SplitPanel, IDELayout, ThreePanelLayout, GridLayout } from './ui/split-panel';
export { LoadingSpinner } from './ui/loading-spinner';
export { ErrorDisplay } from './ui/error-display';

// Types
export type {
  DevSandboxConfig,
  DeviceConfig,
  MountConfig,
  AIConfig,
  NetworkingConfig,
  SandboxEvent,
  FileInfo,
  CommandResult,
  AIResponse,
  ExecutionResult
} from './types';

// Hooks
export { useDevSandbox } from './hooks/use-dev-sandbox';
export { useAIAssistant } from './hooks/use-ai-assistant';
export { useFileSystem } from './hooks/use-file-system';
export { useTerminal } from './hooks/use-terminal';