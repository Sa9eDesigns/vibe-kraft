# Pyodide Workspace Components

A complete Python development environment running in the browser, powered by Pyodide and WebAssembly.

## 🚀 Quick Start

```tsx
import { PyodideWorkspaceLayout } from '@/components/pyodide/workspace/pyodide-workspace-layout';

function MyWorkspace() {
  return (
    <PyodideWorkspaceLayout
      workspaceId="my-workspace"
      onFileOpen={(file) => console.log('Opened:', file.path)}
      onFileChange={(path, content) => console.log('Changed:', path)}
    />
  );
}
```

## 📁 Component Structure

```
components/pyodide/
├── core/                          # Core services and utilities
│   ├── pyodide-runtime.ts        # Python runtime management
│   ├── pyodide-filesystem.ts     # File system operations
│   ├── pyodide-packages.ts       # Package management via micropip
│   └── pyodide-state-manager.ts  # Workspace state persistence
├── workspace/                     # UI components
│   ├── pyodide-workspace-layout.tsx      # Main workspace layout
│   ├── pyodide-workspace-container.tsx   # Workspace container
│   ├── pyodide-terminal.tsx              # Python terminal/REPL
│   ├── pyodide-file-explorer.tsx         # File browser and manager
│   └── pyodide-package-manager.tsx       # Package management UI
└── hooks/
    └── use-pyodide.ts            # React hook for Pyodide integration
```

## 🔧 Core Services

### PyodideRuntime
Manages the Python runtime environment:

```typescript
import { PyodideRuntime } from './core/pyodide-runtime';

const runtime = new PyodideRuntime({
  stdout: (text) => console.log(text),
  stderr: (text) => console.error(text)
});

await runtime.initialize();
const result = await runtime.runPython('print("Hello, World!")');
```

### PyodideFileSystem
Handles file operations with database persistence:

```typescript
import { PyodideFileSystem } from './core/pyodide-filesystem';

const fs = new PyodideFileSystem(runtime, 'workspace-id');
await fs.createFile('hello.py', 'print("Hello!")');
const content = await fs.readFile('hello.py');
```

### PyodidePackageManager
Manages Python packages via micropip:

```typescript
import { PyodidePackageManager } from './core/pyodide-packages';

const pkgManager = new PyodidePackageManager(runtime);
await pkgManager.initialize();
await pkgManager.installPackage('numpy');
```

### PyodideStateManager
Handles workspace state persistence:

```typescript
import { PyodideStateManager } from './core/pyodide-state-manager';

const stateManager = new PyodideStateManager(
  'workspace-id', runtime, fileSystem, packageManager
);
await stateManager.initialize();
await stateManager.saveState();
```

## 🎣 React Hook

The `usePyodide` hook provides a convenient interface:

```tsx
import { usePyodide } from './hooks/use-pyodide';

function PythonComponent() {
  const {
    isInitialized,
    isLoading,
    error,
    runPython,
    createFile,
    installPackage,
    installedPackages,
    saveWorkspace
  } = usePyodide({
    workspaceId: 'my-workspace',
    autoInitialize: true
  });

  if (isLoading) return <div>Loading Python...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={() => runPython('print("Hello!")')}>
        Run Python
      </button>
      <button onClick={() => installPackage('numpy')}>
        Install NumPy
      </button>
      <div>Packages: {installedPackages.length}</div>
    </div>
  );
}
```

## 🖥️ Workspace Components

### PyodideWorkspaceLayout
Main workspace layout with resizable panels:

```tsx
<PyodideWorkspaceLayout
  workspaceId="workspace-id"
  onFileOpen={(file) => console.log('File opened:', file)}
  onFileChange={(path, content) => console.log('File changed:', path)}
  className="h-screen"
/>
```

### PyodideTerminal
Interactive Python terminal:

```tsx
<PyodideTerminal
  workspaceId="workspace-id"
  onCommand={(cmd) => console.log('Command:', cmd)}
  onOutput={(output) => console.log('Output:', output)}
  className="h-64"
/>
```

### PyodideFileExplorer
File browser and manager:

```tsx
<PyodideFileExplorer
  workspaceId="workspace-id"
  onFileSelect={(file) => setSelectedFile(file)}
  onFileOpen={(file) => openInEditor(file)}
  className="w-64"
/>
```

### PyodidePackageManager
Package management interface:

```tsx
<PyodidePackageManager
  workspaceId="workspace-id"
  className="w-80"
/>
```

## 🔌 API Integration

The components integrate with API routes for persistence:

```
/api/workspaces/[id]/pyodide/
├── files/          # File CRUD operations
├── packages/       # Package management
└── state/          # State persistence
```

Example API usage:

```typescript
// Create file
await fetch(`/api/workspaces/${workspaceId}/pyodide/files`, {
  method: 'POST',
  body: JSON.stringify({
    path: 'hello.py',
    content: 'print("Hello!")',
    isDirectory: false
  })
});

// Install package
await fetch(`/api/workspaces/${workspaceId}/pyodide/packages`, {
  method: 'PUT',
  body: JSON.stringify({
    action: 'install',
    packageName: 'numpy'
  })
});
```

## 🎨 Styling and Theming

Components use Shadcn UI and support theming:

```tsx
import { useTheme } from 'next-themes';

// Components automatically adapt to theme
<PyodideWorkspaceLayout
  workspaceId="workspace-id"
  className="bg-background text-foreground"
/>
```

## 🧪 Testing

Run component tests:

```bash
# Run all Pyodide tests
npm test -- --config=jest.config.pyodide.js

# Run specific test file
npm test pyodide-runtime.test.ts

# Run with coverage
npm test -- --config=jest.config.pyodide.js --coverage
```

Test structure:
```
__tests__/pyodide/
├── pyodide-runtime.test.ts      # Runtime tests
├── pyodide-filesystem.test.ts   # File system tests
├── use-pyodide.test.tsx         # Hook tests
└── integration.test.tsx         # Integration tests
```

## 📦 Dependencies

Required packages:
```json
{
  "dependencies": {
    "pyodide": "^0.28.0",
    "@xterm/xterm": "^5.3.0",
    "@xterm/addon-fit": "^0.8.0",
    "@xterm/addon-web-links": "^0.9.0",
    "@xterm/addon-search": "^0.13.0"
  }
}
```

## 🔧 Configuration

### Runtime Configuration
```typescript
const config: PyodideConfig = {
  indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/',
  fullStdLib: false,
  stdout: (text) => console.log(text),
  stderr: (text) => console.error(text)
};
```

### Workspace Configuration
```typescript
const workspaceConfig = {
  pythonPackages: ['numpy', 'matplotlib'],
  environment: {
    WORKSPACE_TYPE: 'pyodide',
    PYTHON_VERSION: '3.11'
  }
};
```

## 🚀 Performance Tips

1. **Lazy Loading**: Initialize Pyodide only when needed
2. **Package Management**: Install packages on-demand
3. **Memory Management**: Clean up unused variables
4. **Caching**: Leverage browser caching for Pyodide assets

```typescript
// Lazy initialization
const { initialize } = usePyodide({
  workspaceId: 'workspace-id',
  autoInitialize: false  // Don't auto-initialize
});

// Initialize when needed
const handleStartPython = async () => {
  await initialize();
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Pyodide fails to load**
   ```typescript
   // Check network and CDN availability
   const runtime = new PyodideRuntime({
     indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/'
   });
   ```

2. **Package installation fails**
   ```python
   # Check package compatibility
   import micropip
   await micropip.install('package-name')
   ```

3. **Memory issues**
   ```typescript
   // Clean up resources
   await runtime.cleanup();
   ```

## 📚 Examples

### Basic Python Execution
```tsx
function PythonRunner() {
  const { runPython, isInitialized } = usePyodide({
    workspaceId: 'example',
    autoInitialize: true
  });

  const runCode = async () => {
    const result = await runPython(`
import math
result = math.sqrt(16)
print(f"Square root of 16 is {result}")
result
    `);
    console.log('Result:', result.result); // 4.0
  };

  return (
    <button onClick={runCode} disabled={!isInitialized}>
      Run Python Code
    </button>
  );
}
```

### File Management
```tsx
function FileManager() {
  const { createFile, readFile, listDirectory } = usePyodide({
    workspaceId: 'example'
  });

  const createPythonFile = async () => {
    await createFile('example.py', `
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
    `);
    
    const files = await listDirectory();
    console.log('Files:', files);
  };

  return <button onClick={createPythonFile}>Create File</button>;
}
```

### Package Installation
```tsx
function PackageInstaller() {
  const { installPackage, installedPackages } = usePyodide({
    workspaceId: 'example'
  });

  const installNumPy = async () => {
    const success = await installPackage('numpy', (progress) => {
      console.log(`Installing: ${progress.progress}%`);
    });
    
    if (success) {
      console.log('NumPy installed successfully!');
    }
  };

  return (
    <div>
      <button onClick={installNumPy}>Install NumPy</button>
      <div>Installed: {installedPackages.map(p => p.name).join(', ')}</div>
    </div>
  );
}
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Use existing UI patterns
5. Handle errors gracefully

## 📄 License

Part of the VibeKraft project. See main project license.
