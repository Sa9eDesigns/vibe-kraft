# WebVM Development Sandbox Library

A comprehensive React component library for creating AI-powered development sandboxes using CheerpX WebVM technology. This library enables you to build web-based IDEs, remote workspaces, and development environments with full Linux support running entirely in the browser.

## 🚀 Features

### Core Capabilities
- **Full Linux Environment**: Complete Debian system running in WebAssembly
- **AI Integration**: GPT-4 and Claude integration with tool calling
- **Monaco Editor**: VS Code-like code editing experience
- **Interactive Terminal**: Full bash terminal with command history
- **File Management**: Visual file explorer with CRUD operations
- **Real-time Collaboration**: Multi-user development environments
- **Zero Installation**: Runs entirely in the browser

### Technical Features
- **High Performance**: WebAssembly JIT compilation for near-native speed
- **Secure Sandbox**: Isolated execution environment
- **Networking Support**: Tailscale integration for remote access
- **Persistent Storage**: IndexedDB and cloud storage options
- **Responsive Design**: Mobile-friendly adaptive layouts
- **Type Safety**: Full TypeScript support

## 📦 Installation

```bash
# Install the library and dependencies
pnpm install @monaco-editor/react @xterm/xterm @xterm/addon-fit @xterm/addon-web-links
pnpm install ai @ai-sdk/react @ai-sdk/openai @ai-sdk/anthropic
pnpm install react-resizable-panels
```

## 🔧 Setup

### 1. Include CheerpX Script

Add the CheerpX script to your HTML head:

```html
<script src="https://cxrtnc.leaningtech.com/2.0/cx.js" async></script>
```

### 2. Configure Cross-Origin Isolation

For SharedArrayBuffer support, configure your server headers:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### 3. Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 🎯 Quick Start

### Basic Sandbox

```tsx
import { SandboxContainer } from '@/components/webvm';
import type { DevSandboxConfig } from '@/components/webvm/types';

const config: DevSandboxConfig = {
  diskImage: 'wss://disks.webvm.io/debian_large_20230522_5044875331.ext2',
  mounts: [
    { type: 'ext2', path: '/', dev: 'overlay' },
    { type: 'dir', path: '/workspace', dev: 'web' }
  ],
  aiProvider: 'openai',
  aiConfig: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
    tools: [],
    capabilities: {
      terminalControl: true,
      visualInterface: true,
      codeGeneration: true,
      debugging: true,
      fileSystemAccess: true
    },
    safety: {
      confirmActions: true,
      restrictedCommands: ['rm -rf /', 'dd'],
      maxExecutionTime: 30000
    }
  },
  editor: 'monaco',
  theme: 'auto',
  layout: {
    defaultLayout: 'horizontal',
    panels: [
      { type: 'fileExplorer', size: 20 },
      { type: 'editor', size: 50 },
      { type: 'terminal', size: 30 }
    ],
    resizable: true,
    collapsible: true
  },
  crossOriginIsolation: true
};

function App() {
  return (
    <SandboxContainer
      config={config}
      onReady={(sandbox) => console.log('Sandbox ready!')}
      onError={(error) => console.error('Sandbox error:', error)}
      height="100vh"
      width="100%"
      autoStart={true}
      showControls={true}
      showStatus={true}
    />
  );
}
```

### Using Individual Components

```tsx
import { 
  useDevSandbox, 
  CodeEditor, 
  Terminal, 
  FileExplorer, 
  AIAssistant,
  IDELayout 
} from '@/components/webvm';

function CustomIDE() {
  const { sandbox, isLoading, error } = useDevSandbox(config);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!sandbox) return null;

  return (
    <IDELayout
      fileExplorer={
        <FileExplorer
          sandbox={sandbox}
          onFileSelect={(file) => console.log('Selected:', file)}
        />
      }
      
      editor={
        <CodeEditor
          sandbox={sandbox}
          language="python"
          aiAssistance={true}
        />
      }
      
      terminal={
        <Terminal
          sandbox={sandbox}
          aiIntegration={true}
        />
      }
      
      aiAssistant={
        <AIAssistant
          sandbox={sandbox}
          model="gpt-4"
          capabilities={['terminal', 'visual', 'code-generation']}
        />
      }
      
      showAI={true}
    />
  );
}
```

### Advanced File Operations

```tsx
import { useFileSystem } from '@/components/webvm';

function FileManager() {
  const { sandbox } = useDevSandbox(config);
  const {
    files,
    currentPath,
    navigateToPath,
    createFile,
    deleteFile,
    readFile,
    writeFile
  } = useFileSystem(sandbox);

  const handleCreateFile = async () => {
    await createFile('/workspace/newfile.py', '# Hello World\nprint("Hello from WebVM!")');
  };

  const handleEditFile = async (path: string) => {
    const content = await readFile(path);
    // Edit content...
    await writeFile(path, modifiedContent);
  };

  return (
    <div>
      <button onClick={handleCreateFile}>Create File</button>
      {files.map(file => (
        <div key={file.path}>
          <span>{file.name}</span>
          <button onClick={() => handleEditFile(file.path)}>Edit</button>
          <button onClick={() => deleteFile(file.path)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### AI Assistant Integration

```tsx
import { useAIAssistant } from '@/components/webvm';

function AICodeHelper() {
  const { sandbox } = useDevSandbox(config);
  const {
    messages,
    sendMessage,
    generateCode,
    analyzeCode,
    debugCode
  } = useAIAssistant(sandbox, 'gpt-4', ['terminal', 'code-generation']);

  const handleCodeGeneration = async () => {
    const code = await generateCode(
      'Create a Python function to calculate fibonacci numbers',
      'python'
    );
    console.log('Generated code:', code);
  };

  const handleCodeAnalysis = async (code: string) => {
    const analysis = await analyzeCode(code, 'python');
    console.log('Code analysis:', analysis);
  };

  return (
    <div>
      <button onClick={handleCodeGeneration}>Generate Code</button>
      <button onClick={() => handleCodeAnalysis(selectedCode)}>Analyze Code</button>
    </div>
  );
}
```

## 🔨 API Reference

### Core Types

```typescript
interface DevSandboxConfig {
  diskImage: string;
  mounts: MountConfig[];
  networking?: NetworkingConfig;
  aiProvider: 'openai' | 'anthropic' | 'custom';
  aiConfig: AIConfig;
  editor: 'monaco' | 'codemirror';
  theme: 'light' | 'dark' | 'auto';
  layout: LayoutConfig;
  crossOriginIsolation: boolean;
  allowedOrigins?: string[];
}

interface AIConfig {
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
```

### Hooks

#### useDevSandbox

```typescript
const {
  sandbox,
  isLoading,
  isReady,
  error,
  events,
  initialize,
  destroy,
  restart
} = useDevSandbox(config);
```

#### useFileSystem

```typescript
const {
  currentPath,
  files,
  selectedFile,
  navigateToPath,
  readFile,
  writeFile,
  createFile,
  deleteFile,
  searchFiles
} = useFileSystem(sandbox, '/home/user');
```

#### useAIAssistant

```typescript
const {
  messages,
  sendMessage,
  generateCode,
  analyzeCode,
  debugCode,
  executeCommand,
  takeScreenshot
} = useAIAssistant(sandbox, 'gpt-4', capabilities);
```

#### useTerminal

```typescript
const {
  isConnected,
  output,
  commandHistory,
  executeCommand,
  clearTerminal,
  interrupt
} = useTerminal(sandbox, 'user@webvm:~$ ');
```

## 🎨 UI Components

### SandboxContainer

The main container component that orchestrates the entire WebVM environment.

```typescript
interface SandboxContainerProps {
  config: DevSandboxConfig;
  onReady?: (sandbox: DevSandbox) => void;
  onError?: (error: Error) => void;
  className?: string;
  height?: string | number;
  width?: string | number;
  showControls?: boolean;
  showStatus?: boolean;
  autoStart?: boolean;
}
```

### CodeEditor

Monaco-based code editor with AI integration.

```typescript
interface CodeEditorProps {
  sandbox: DevSandbox;
  initialFile?: string;
  language?: string;
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  aiAssistance?: boolean;
  onFileChange?: (file: string, content: string) => void;
  onRun?: (code: string) => void;
  readOnly?: boolean;
}
```

### Terminal

Interactive terminal with xterm.js.

```typescript
interface TerminalProps {
  sandbox: DevSandbox;
  theme?: 'dark' | 'light';
  aiIntegration?: boolean;
  customPrompt?: string;
  onOutput?: (output: string) => void;
  onCommand?: (command: string) => void;
}
```

### FileExplorer

Visual file browser with context menus.

```typescript
interface FileExplorerProps {
  sandbox: DevSandbox;
  rootPath?: string;
  showHidden?: boolean;
  onFileSelect?: (file: FileInfo) => void;
  onFileCreate?: (path: string) => void;
  onFileDelete?: (path: string) => void;
}
```

### AIAssistant

Chat interface with AI capabilities.

```typescript
interface AIAssistantProps {
  sandbox: DevSandbox;
  model: 'claude-3.7' | 'gpt-4' | 'custom';
  capabilities: AICapability[];
  onCommand?: (command: string) => void;
  onCodeGenerate?: (code: string, language: string) => void;
}
```

## 🔧 Advanced Configuration

### Custom Layouts

```typescript
import { SplitPanel, GridLayout } from '@/components/webvm';

// Custom horizontal split
<SplitPanel orientation="horizontal" initialSizes={[30, 70]}>
  <FileExplorer sandbox={sandbox} />
  <CodeEditor sandbox={sandbox} />
</SplitPanel>

// Grid layout
<GridLayout rows={2} cols={2}>
  <FileExplorer sandbox={sandbox} />
  <CodeEditor sandbox={sandbox} />
  <Terminal sandbox={sandbox} />
  <AIAssistant sandbox={sandbox} />
</GridLayout>
```

### Custom AI Tools

```typescript
const customTools: AITool[] = [
  {
    name: 'deployApp',
    description: 'Deploy application to staging environment',
    parameters: {
      type: 'object',
      properties: {
        environment: { type: 'string', enum: ['staging', 'production'] }
      }
    },
    execute: async ({ environment }) => {
      // Custom deployment logic
      return { status: 'deployed', environment };
    }
  }
];
```

### Networking Configuration

```typescript
const networkingConfig: NetworkingConfig = {
  tailscale: {
    enabled: true,
    authKey: process.env.TAILSCALE_AUTH_KEY!,
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
      { host: 3000, container: 3000, protocol: 'tcp' }
    ]
  }
};
```

## 🛡️ Security Considerations

### Browser Requirements
- SharedArrayBuffer support
- Cross-Origin Isolation headers
- Modern WebAssembly support

### Safety Features
- Sandboxed execution environment
- Restricted command filtering
- API key protection
- Resource limits

### Best Practices
- Always use HTTPS in production
- Configure proper CORS headers
- Implement user session management
- Monitor resource usage
- Regular security updates

## 🎯 Use Cases

### Web-based IDEs
- Code editing and execution
- Multi-language support
- Real-time collaboration
- Git integration

### Remote Development
- Cloud-based workspaces
- Container development
- DevOps automation
- CI/CD pipelines

### Educational Platforms
- Programming tutorials
- Interactive coding exercises
- Sandbox environments
- Code challenges

### Prototyping Tools
- Rapid development
- Proof of concepts
- Demo environments
- Testing platforms

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📚 Additional Resources

- [CheerpX Documentation](https://cheerpx.io/docs)
- [AI SDK Documentation](https://sdk.vercel.ai)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/)
- [xterm.js Documentation](https://xtermjs.org/)

## 🆘 Support

- [GitHub Issues](https://github.com/your-org/webvm-library/issues)
- [Discord Community](https://discord.gg/your-server)
- [Documentation](https://docs.your-domain.com)