// Core Types for WebVM Integration
export interface DevSandboxConfig {
  // CheerpX Configuration
  diskImage: string;
  mounts: MountConfig[];
  networking?: NetworkingConfig;
  
  // AI Integration
  aiProvider: 'openai' | 'anthropic' | 'custom';
  aiConfig: AIConfig;
  
  // UI Configuration
  editor: 'monaco' | 'codemirror';
  theme: 'light' | 'dark' | 'auto';
  layout: LayoutConfig;
  
  // Security
  crossOriginIsolation: boolean;
  allowedOrigins?: string[];
}

export interface DeviceConfig {
  cloudDevice?: {
    url: string;
    readOnly: boolean;
  };
  idbDevice?: {
    name: string;
    persistent: boolean;
  };
  overlayDevice?: {
    enabled: boolean;
  };
  webDevice?: {
    baseUrl: string;
    cors: boolean;
  };
  dataDevice?: {
    enabled: boolean;
  };
}

export interface MountConfig {
  type: 'ext2' | 'dir' | 'devs';
  path: string;
  dev: string;
  options?: Record<string, any>;
}

export interface AIConfig {
  apiKey: string;
  model: string;
  tools: AITool[];
  capabilities: {
    terminalControl: boolean;
    visualInterface: boolean;
    codeGeneration: boolean;
    debugging: boolean;
    fileSystemAccess: boolean;
  };
  safety: {
    confirmActions: boolean;
    restrictedCommands: string[];
    maxExecutionTime: number;
  };
}

export interface NetworkingConfig {
  tailscale?: {
    enabled: boolean;
    authKey: string;
    controlUrl?: string;
    exitNode?: string;
    routes?: string[];
    loginUrlCb?: (url: string) => void;
    stateUpdateCb?: (state: number) => void;
    netmapUpdateCb?: (map: any) => void;
  };
  ssh?: {
    enabled: boolean;
    keyPath: string;
    knownHosts: string[];
  };
  portForwarding?: {
    enabled: boolean;
    ports: PortMapping[];
  };
}

export interface LayoutConfig {
  defaultLayout: 'horizontal' | 'vertical' | 'grid';
  panels: PanelConfig[];
  resizable: boolean;
  collapsible: boolean;
}

export interface PanelConfig {
  type: 'editor' | 'terminal' | 'fileExplorer' | 'ai' | 'custom';
  size: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface PortMapping {
  host: number;
  container: number;
  protocol: 'tcp' | 'udp';
}

export interface SandboxEvent {
  type: 'ready' | 'error' | 'command' | 'fileChange' | 'networkChange' | 'aiMessage';
  data?: any;
  timestamp: number;
}

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modified: Date;
  permissions: string;
  owner: string;
  group: string;
}

export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  timestamp: Date;
}

export interface AIResponse {
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'tool_ready' | 'system';
  content: string;
  toolCall?: {
    name: string;
    parameters: Record<string, any>;
    result?: any;
  };
  timestamp: Date;
  data?: any;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  metadata?: Record<string, any>;
}

export interface TerminalConfig {
  rows: number;
  cols: number;
  cursorBlink: boolean;
  cursorStyle: 'block' | 'underline' | 'bar';
  fontSize: number;
  fontFamily: string;
  theme: TerminalTheme;
  scrollback: number;
  bellStyle: 'none' | 'visual' | 'sound';
}

export interface TerminalTheme {
  foreground: string;
  background: string;
  cursor: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface EditorConfig {
  language: string;
  theme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  fontSize: number;
  fontFamily: string;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: {
    enabled: boolean;
    side: 'left' | 'right';
    size: 'proportional' | 'fill' | 'fit';
  };
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
  formatOnSave: boolean;
  formatOnType: boolean;
  linting: boolean;
  intelliSense: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'tool_use' | 'tool_result';
  metadata?: Record<string, any>;
}

export interface ComputerUseConfig {
  screenshot: {
    maxResolution: { width: number; height: number };
    quality: 'high' | 'medium' | 'low';
    interval: number;
  };
  interactions: {
    mouse: boolean;
    keyboard: boolean;
    wait: boolean;
  };
  safety: {
    confirmActions: boolean;
    restrictedCommands: string[];
    maxExecutionTime: number;
  };
}

export interface BashToolConfig {
  enabled: boolean;
  sentinelMarker: string;
  timeout: number;
  collaboration: {
    showCommands: boolean;
    requireConfirmation: boolean;
    logHistory: boolean;
  };
}