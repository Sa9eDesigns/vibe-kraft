import type { DevSandboxConfig } from '../types';

// Basic configuration for a Python development environment
export const pythonDevConfig: DevSandboxConfig = {
  // CheerpX Configuration
  diskImage: 'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2',
  mounts: [
    { type: 'ext2', path: '/', dev: 'overlay' },
    { type: 'dir', path: '/workspace', dev: 'web' },
    { type: 'dir', path: '/data', dev: 'data' },
    { type: 'devs', path: '/dev', dev: 'devs' }
  ],
  
  // AI Integration
  aiProvider: 'openai',
  aiConfig: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview',
    tools: [],
    capabilities: {
      terminalControl: true,
      visualInterface: false, // Disabled for basic config
      codeGeneration: true,
      debugging: true,
      fileSystemAccess: true
    },
    safety: {
      confirmActions: true,
      restrictedCommands: ['rm -rf /', 'dd', 'mkfs', 'fdisk'],
      maxExecutionTime: 30000 // 30 seconds
    }
  },
  
  // UI Configuration
  editor: 'monaco',
  theme: 'auto',
  layout: {
    defaultLayout: 'horizontal',
    panels: [
      { type: 'fileExplorer', size: 20, minSize: 15, collapsible: true },
      { type: 'editor', size: 50, minSize: 30 },
      { type: 'terminal', size: 30, minSize: 20 }
    ],
    resizable: true,
    collapsible: true
  },
  
  // Security
  crossOriginIsolation: true,
  allowedOrigins: [window?.location?.origin || 'http://localhost:3000']
};

// Advanced configuration with AI visual capabilities
export const advancedDevConfig: DevSandboxConfig = {
  // CheerpX Configuration
  diskImage: 'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2',
  mounts: [
    { type: 'ext2', path: '/', dev: 'overlay' },
    { type: 'dir', path: '/workspace', dev: 'web' },
    { type: 'dir', path: '/data', dev: 'data' },
    { type: 'devs', path: '/dev', dev: 'devs' }
  ],
  
  // Networking (optional)
  networking: {
    tailscale: {
      enabled: false, // Enable if you have Tailscale setup
      authKey: process.env.TAILSCALE_AUTH_KEY || '',
      routes: ['10.0.0.0/8']
    },
    ssh: {
      enabled: true,
      keyPath: '/home/user/.ssh/id_rsa',
      knownHosts: ['github.com', 'gitlab.com']
    },
    portForwarding: {
      enabled: true,
      ports: [
        { host: 8080, container: 80, protocol: 'tcp' },
        { host: 3000, container: 3000, protocol: 'tcp' },
        { host: 5000, container: 5000, protocol: 'tcp' }
      ]
    }
  },
  
  // AI Integration with Claude
  aiProvider: 'anthropic',
  aiConfig: {
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
    model: 'claude-3.7-sonnet',
    tools: [],
    capabilities: {
      terminalControl: true,
      visualInterface: true, // Enable computer use
      codeGeneration: true,
      debugging: true,
      fileSystemAccess: true
    },
    safety: {
      confirmActions: true,
      restrictedCommands: [
        'rm -rf /',
        'dd',
        'mkfs',
        'fdisk',
        'parted',
        'shutdown',
        'reboot',
        'halt',
        'poweroff'
      ],
      maxExecutionTime: 60000 // 60 seconds for complex operations
    }
  },
  
  // UI Configuration
  editor: 'monaco',
  theme: 'auto',
  layout: {
    defaultLayout: 'horizontal',
    panels: [
      { type: 'fileExplorer', size: 15, minSize: 10, collapsible: true },
      { type: 'editor', size: 45, minSize: 30 },
      { type: 'terminal', size: 25, minSize: 15 },
      { type: 'ai', size: 15, minSize: 10, collapsible: true }
    ],
    resizable: true,
    collapsible: true
  },
  
  // Security
  crossOriginIsolation: true,
  allowedOrigins: [window?.location?.origin || 'http://localhost:3000']
};

// Minimal configuration for testing
export const minimalConfig: DevSandboxConfig = {
  diskImage: 'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2',
  mounts: [
    { type: 'ext2', path: '/', dev: 'overlay' }
  ],
  
  aiProvider: 'openai',
  aiConfig: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    tools: [],
    capabilities: {
      terminalControl: false,
      visualInterface: false,
      codeGeneration: false,
      debugging: false,
      fileSystemAccess: false
    },
    safety: {
      confirmActions: true,
      restrictedCommands: [],
      maxExecutionTime: 15000
    }
  },
  
  editor: 'monaco',
  theme: 'auto',
  layout: {
    defaultLayout: 'vertical',
    panels: [
      { type: 'terminal', size: 100 }
    ],
    resizable: false,
    collapsible: false
  },
  
  crossOriginIsolation: true
};

// Configuration for educational use
export const educationalConfig: DevSandboxConfig = {
  diskImage: 'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2',
  mounts: [
    { type: 'ext2', path: '/', dev: 'overlay' },
    { type: 'dir', path: '/lessons', dev: 'web' },
    { type: 'dir', path: '/exercises', dev: 'data' }
  ],
  
  aiProvider: 'openai',
  aiConfig: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    model: 'gpt-4',
    tools: [],
    capabilities: {
      terminalControl: true,
      visualInterface: false,
      codeGeneration: true,
      debugging: true,
      fileSystemAccess: true
    },
    safety: {
      confirmActions: true,
      restrictedCommands: [
        'rm -rf /',
        'dd',
        'mkfs',
        'fdisk',
        'sudo rm',
        'sudo dd'
      ],
      maxExecutionTime: 20000
    }
  },
  
  editor: 'monaco',
  theme: 'auto',
  layout: {
    defaultLayout: 'horizontal',
    panels: [
      { type: 'fileExplorer', size: 25, minSize: 20, collapsible: false },
      { type: 'editor', size: 75, minSize: 50 }
    ],
    resizable: true,
    collapsible: false
  },
  
  crossOriginIsolation: true
};

// Export all configurations
export const configs = {
  python: pythonDevConfig,
  advanced: advancedDevConfig,
  minimal: minimalConfig,
  educational: educationalConfig
};