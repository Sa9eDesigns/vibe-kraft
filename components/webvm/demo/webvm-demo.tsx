'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  AlertCircle, 
  Info, 
  Code, 
  Terminal, 
  Bot,
  Folder,
  Monitor,
  Zap,
  Shield,
  Cpu,
  Globe
} from 'lucide-react';
import { SandboxContainer } from '../ui/sandbox-container';
import { NetworkingConfig } from '../ui/networking-config';
import { WorkspaceManager } from '../ui/workspace-manager';
import { WorkspaceLayoutV2 } from '../ui/workspace-layout-v2';
import { ensureCheerpXLoaded, checkCheerpXCompatibility } from '../utils/cheerpx-loader';
import type { DevSandboxConfig, NetworkingConfig as NetworkingConfigType } from '../types';

export function WebVMDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkingConfig, setNetworkingConfig] = useState<NetworkingConfigType>({
    tailscale: {
      enabled: false,
      authKey: '',
      controlUrl: 'https://controlplane.tailscale.com',
      routes: []
    },
    ssh: {
      enabled: false,
      keyPath: '/home/user/.ssh/id_rsa.pub',
      knownHosts: []
    },
    portForwarding: {
      enabled: false,
      ports: []
    }
  });
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [sandbox, setSandbox] = useState<any>(null);

  // Demo configuration
  const demoConfig: DevSandboxConfig = {
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
      model: 'gpt-4',
      tools: [],
      capabilities: {
        terminalControl: true,
        visualInterface: false, // Disabled for demo
        codeGeneration: true,
        debugging: true,
        fileSystemAccess: true
      },
      safety: {
        confirmActions: true,
        restrictedCommands: ['rm -rf /', 'dd', 'mkfs'],
        maxExecutionTime: 30000
      }
    },
    
    // UI Configuration
    editor: 'monaco',
    theme: 'auto',
    layout: {
      defaultLayout: 'horizontal',
      panels: [
        { type: 'fileExplorer', size: 20, minSize: 15, collapsible: true },
        { type: 'editor', size: 40, minSize: 30 },
        { type: 'terminal', size: 25, minSize: 20 },
        { type: 'ai', size: 15, minSize: 10, collapsible: true }
      ],
      resizable: true,
      collapsible: true
    },
    
    // Networking Configuration
    networking: networkingConfig,

    // Security
    crossOriginIsolation: true,
    allowedOrigins: [window.location.origin]
  };

  const features = [
    {
      icon: <Monitor className="h-5 w-5" />,
      title: "Full Linux Environment",
      description: "Complete Debian system running in your browser with WebAssembly"
    },
    {
      icon: <Code className="h-5 w-5" />,
      title: "Monaco Code Editor",
      description: "VS Code-like editing experience with syntax highlighting and IntelliSense"
    },
    {
      icon: <Terminal className="h-5 w-5" />,
      title: "Interactive Terminal",
      description: "Full bash terminal with command history and auto-completion"
    },
    {
      icon: <Bot className="h-5 w-5" />,
      title: "AI Assistant",
      description: "GPT-4 powered coding assistant with context awareness"
    },
    {
      icon: <Folder className="h-5 w-5" />,
      title: "File Management",
      description: "Browse, create, edit, and manage files with a visual file explorer"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "High Performance",
      description: "WebAssembly JIT compilation for near-native execution speed"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Sandbox",
      description: "Isolated execution environment with no access to your local system"
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: "Zero Installation",
      description: "No downloads or installations required - runs entirely in your browser"
    }
  ];

  const startDemo = () => {
    // Check for required browser features
    if (!window.SharedArrayBuffer) {
      setError('Your browser does not support SharedArrayBuffer. Please enable cross-origin isolation or use a compatible browser.');
      return;
    }

    if (!window.WebAssembly) {
      setError('Your browser does not support WebAssembly. Please use a modern browser.');
      return;
    }

    setError(null);
    setShowDemo(true);
  };

  const startWorkspaceDemo = () => {
    setShowWorkspace(true);
  };

  if (showWorkspace) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">WebVM Workspace Interface</h2>
            <Badge variant="secondary">Demo Mode</Badge>
          </div>
          <Button variant="outline" onClick={() => setShowWorkspace(false)}>
            Back to Overview
          </Button>
        </div>
        <div className="h-[calc(100%-73px)]">
          <WorkspaceLayoutV2
            sandbox={sandbox}
            networkingConfig={networkingConfig}
            onNetworkingChange={setNetworkingConfig}
            onFileOpen={(file) => console.log('File opened:', file)}
            onFileChange={(path, content) => console.log('File changed:', path)}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  if (showDemo) {
    return (
      <div className="h-full">
        <SandboxContainer
          config={demoConfig}
          onReady={(sandboxInstance) => {
            setSandbox(sandboxInstance);
            console.log('WebVM Demo Ready:', sandboxInstance);
          }}
          onError={(error) => {
            console.error('WebVM Demo Error:', error);
            setError(error.message);
            setShowDemo(false);
          }}
          className="h-full"
          autoStart={true}
          showControls={true}
          showStatus={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">WebVM Development Environment</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience a complete Linux development environment with AI assistance, 
            running entirely in your browser using cutting-edge WebAssembly technology.
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary">CheerpX Powered</Badge>
          <Badge variant="secondary">AI Enhanced</Badge>
          <Badge variant="secondary">Zero Installation</Badge>
        </div>
      </div>

      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="networking">Networking</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="demo">Try Demo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {feature.icon}
                    <CardTitle className="text-sm">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="networking" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NetworkingConfig
              config={networkingConfig}
              onChange={setNetworkingConfig}
              connectionStatus={connectionStatus}
              onConnect={() => {
                setConnectionStatus('connecting');
                // Simulate connection process
                setTimeout(() => {
                  setConnectionStatus('connected');
                }, 2000);
              }}
              onDisconnect={() => {
                setConnectionStatus('disconnected');
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>Remote Workspace Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Secure VPN Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Connect your WebVM to your private Tailscale network for secure remote access
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Zero Infrastructure</h4>
                      <p className="text-sm text-muted-foreground">
                        No servers to maintain - everything runs client-side in your browser
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Instant Scaling</h4>
                      <p className="text-sm text-muted-foreground">
                        Scales automatically with your user base - no capacity planning needed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkspaceManager
              sandbox={sandbox}
              onProjectSelect={(project) => {
                console.log('Selected project:', project);
              }}
              onProjectCreate={(project) => {
                console.log('Created project:', project);
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Folder className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Multi-Project Support</h4>
                      <p className="text-sm text-muted-foreground">
                        Organize multiple development projects with templates and metadata
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Code className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Language Templates</h4>
                      <p className="text-sm text-muted-foreground">
                        Pre-configured templates for Python, Node.js, React, Rust, and more
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">AI-Powered Development</h4>
                      <p className="text-sm text-muted-foreground">
                        Integrated AI assistant with access to terminal, files, and development tools
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browser Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Required Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>WebAssembly (WASM) support</li>
                  <li>SharedArrayBuffer support</li>
                  <li>Cross-Origin Isolation headers</li>
                  <li>Modern ES2020+ JavaScript support</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Recommended Browsers:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Chrome 88+ (recommended)</li>
                  <li>Firefox 89+</li>
                  <li>Safari 15.2+</li>
                  <li>Edge 88+</li>
                </ul>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  The demo requires significant browser resources. For the best experience, 
                  close unnecessary tabs and ensure you have at least 2GB of available RAM.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ready to Try WebVM?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click the button below to launch a full Linux development environment 
                  with AI assistance. The initial load may take 30-60 seconds as we 
                  download and initialize the system.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    <div className="text-xs">
                      <div className="font-medium">System</div>
                      <div className="text-muted-foreground">Debian Linux</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-green-500" />
                    <div className="text-xs">
                      <div className="font-medium">Languages</div>
                      <div className="text-muted-foreground">Python, Node.js, C++</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-500" />
                    <div className="text-xs">
                      <div className="font-medium">AI Model</div>
                      <div className="text-muted-foreground">GPT-4 Turbo</div>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This demo uses a pre-built Debian image. All your work will be lost 
                    when you close the browser. For persistent storage, you would typically 
                    configure cloud storage or local IndexedDB persistence.
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button
                  onClick={startWorkspaceDemo}
                  size="lg"
                  className="gap-2"
                  variant="default"
                >
                  <Monitor className="h-4 w-4" />
                  Try Workspace Interface
                </Button>
                <Button
                  onClick={startDemo}
                  size="lg"
                  className="gap-2"
                  variant="outline"
                >
                  <Play className="h-4 w-4" />
                  Launch Full WebVM
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  <strong>Workspace Interface:</strong> Experience the VSCode-like interface with resizable panels and tabs
                </p>
                <p className="mt-1">
                  <strong>Full WebVM:</strong> Complete Linux environment with terminal access and AI integration
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}