# Pyodide Workspace Documentation

## Overview

The Pyodide Workspace is a browser-based Python development environment powered by [Pyodide](https://pyodide.org/), which brings the Python scientific stack to the browser via WebAssembly. This implementation provides a full-featured Python workspace that runs entirely in the browser without requiring server-side Python execution.

## Features

### Core Capabilities
- **Python 3.11 Runtime**: Full CPython implementation in WebAssembly
- **Scientific Computing**: Pre-installed packages like NumPy, Pandas, Matplotlib
- **File System**: Persistent file storage with database synchronization
- **Package Management**: Install Python packages via micropip
- **Terminal Integration**: Interactive Python REPL with xterm.js
- **State Persistence**: Workspace state saved across sessions
- **Real-time Execution**: Instant Python code execution in the browser

### User Interface
- **Resizable Panels**: VSCode-like layout with adjustable panels
- **File Explorer**: Browse, create, edit, and manage Python files
- **Code Editor**: Syntax highlighting and basic editing features
- **Terminal**: Interactive Python shell with command history
- **Package Manager**: GUI for installing and managing Python packages

## Architecture

### Component Structure
```
components/pyodide/
├── core/                          # Core services
│   ├── pyodide-runtime.ts        # Python runtime management
│   ├── pyodide-filesystem.ts     # File system operations
│   ├── pyodide-packages.ts       # Package management
│   └── pyodide-state-manager.ts  # State persistence
├── workspace/                     # UI components
│   ├── pyodide-workspace-layout.tsx      # Main layout
│   ├── pyodide-workspace-container.tsx   # Container wrapper
│   ├── pyodide-terminal.tsx              # Terminal component
│   ├── pyodide-file-explorer.tsx         # File browser
│   └── pyodide-package-manager.tsx       # Package manager UI
└── hooks/
    └── use-pyodide.ts            # React hook for Pyodide integration
```

### API Routes
```
app/api/workspaces/[id]/pyodide/
├── files/                        # File operations
│   ├── route.ts                 # CRUD operations for files
│   └── [...path]/route.ts       # Individual file operations
├── packages/route.ts            # Package management
└── state/route.ts               # Workspace state persistence
```

## Installation and Setup

### Dependencies
The Pyodide workspace requires the following packages:

```bash
pnpm add pyodide @xterm/xterm @xterm/addon-fit @xterm/addon-web-links @xterm/addon-search
```

### Database Schema
Ensure your database includes the PYODIDE workspace type:

```prisma
enum WorkspaceType {
  WEBVM
  FIRECRACKER
  PYODIDE     // Add this line
}
```

### Environment Configuration
No additional environment variables are required. Pyodide runs entirely in the browser.

## Usage

### Creating a Pyodide Workspace

1. **Via Unified Workspace Launcher**:
```tsx
import { UnifiedWorkspaceLauncher } from '@/components/workspace/unified-workspace-launcher';

<UnifiedWorkspaceLauncher
  userId={userId}
  projectId={projectId}
  onLaunch={(workspaceId, type) => {
    if (type === 'PYODIDE') {
      router.push(`/workspace/pyodide/${workspaceId}`);
    }
  }}
/>
```

2. **Direct API Call**:
```typescript
const response = await fetch('/api/workspaces', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Python Workspace',
    projectId: 'project-id',
    type: 'PYODIDE',
    config: {
      environment: {
        WORKSPACE_TYPE: 'pyodide',
        PYTHON_VERSION: '3.11'
      }
    }
  })
});
```

### Using the Pyodide Hook

```tsx
import { usePyodide } from '@/components/pyodide/hooks/use-pyodide';

function MyComponent() {
  const {
    isInitialized,
    isLoading,
    error,
    runPython,
    createFile,
    installPackage,
    saveWorkspace
  } = usePyodide({
    workspaceId: 'workspace-id',
    autoInitialize: true
  });

  const handleRunCode = async () => {
    const result = await runPython('print("Hello, World!")');
    console.log(result.output); // "Hello, World!"
  };

  const handleInstallPackage = async () => {
    const success = await installPackage('requests');
    if (success) {
      console.log('Package installed successfully');
    }
  };

  return (
    <div>
      {isLoading && <div>Loading Python environment...</div>}
      {error && <div>Error: {error}</div>}
      {isInitialized && (
        <div>
          <button onClick={handleRunCode}>Run Python Code</button>
          <button onClick={handleInstallPackage}>Install Package</button>
        </div>
      )}
    </div>
  );
}
```

### File Operations

```typescript
// Create a new Python file
await createFile('hello.py', 'print("Hello, World!")');

// Read file content
const content = await readFile('hello.py');

// Write to file
await writeFile('hello.py', 'print("Updated content")');

// List directory contents
const files = await listDirectory();

// Upload file from browser
const file = new File(['print("Uploaded")'], 'uploaded.py');
await uploadFile(file);

// Download file
const blob = await downloadFile('hello.py');
```

### Package Management

```typescript
// Install a package
const success = await installPackage('numpy');

// Install with progress tracking
await installPackage('pandas', (progress) => {
  console.log(`${progress.status}: ${progress.progress}%`);
});

// Uninstall package
await uninstallPackage('numpy');

// Get installed packages
const packages = await getInstalledPackages();

// Search for packages
const results = await searchPackages('matplotlib');
```

### State Management

```typescript
// Save workspace state
await saveWorkspace();

// Load workspace state
await loadWorkspace();

// Export workspace for backup
const stateJson = await exportWorkspace();

// Import workspace from backup
await importWorkspace(stateJson);

// Mark state as dirty (needs saving)
markStateDirty();
```

## Configuration Options

### Runtime Configuration
```typescript
const config: PyodideConfig = {
  indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.0/full/',
  fullStdLib: false,
  stdout: (text) => console.log(text),
  stderr: (text) => console.error(text),
  jsglobals: { customVar: 'value' }
};
```

### Workspace Configuration
```typescript
const workspaceConfig = {
  pythonPackages: ['numpy', 'matplotlib', 'pandas'],
  environment: {
    WORKSPACE_TYPE: 'pyodide',
    PYTHON_VERSION: '3.11'
  }
};
```

## Advanced Features

### Custom Python Modules
```python
# Create custom modules in the workspace
# File: mymodule.py
def hello(name):
    return f"Hello, {name}!"

# File: main.py
import mymodule
print(mymodule.hello("World"))
```

### JavaScript-Python Interoperability
```typescript
// Set JavaScript variables in Python
runtime.setGlobal('jsData', { key: 'value' });

// Access in Python
await runPython(`
import js
print(js.jsData.key)  # Outputs: value
`);

// Return data from Python to JavaScript
const result = await runPython(`
import json
data = {'result': 42}
json.dumps(data)
`);
console.log(JSON.parse(result.result)); // { result: 42 }
```

### File System Persistence
Files are automatically synchronized with the database:

```typescript
// Files are saved to IndexedDB locally
await writeFile('data.csv', csvContent);

// And synchronized to the database
// No additional action required
```

## Performance Considerations

### Initialization Time
- First load: ~3-5 seconds (downloading Pyodide)
- Subsequent loads: ~1-2 seconds (cached)
- Package installation: Varies by package size

### Memory Usage
- Base Pyodide: ~50MB
- With scientific packages: ~100-150MB
- File storage: Limited by browser storage quotas

### Optimization Tips
1. **Lazy Loading**: Only load packages when needed
2. **Code Splitting**: Split large Python scripts
3. **Caching**: Leverage browser caching for Pyodide assets
4. **Cleanup**: Properly cleanup resources when done

## Troubleshooting

### Common Issues

1. **Pyodide fails to load**
   - Check network connectivity
   - Verify CDN availability
   - Clear browser cache

2. **Package installation fails**
   - Check package compatibility with Pyodide
   - Verify package name spelling
   - Try installing dependencies first

3. **File operations fail**
   - Check file permissions
   - Verify workspace initialization
   - Check database connectivity

4. **Memory issues**
   - Reduce loaded packages
   - Clear Python variables
   - Restart workspace

### Debug Mode
Enable debug logging:

```typescript
const runtime = new PyodideRuntime({
  stdout: console.log,
  stderr: console.error
});
```

## Testing

### Running Tests
```bash
# Run Pyodide-specific tests
npm test -- --config=jest.config.pyodide.js

# Run with coverage
npm test -- --config=jest.config.pyodide.js --coverage
```

### Test Structure
```
__tests__/pyodide/
├── pyodide-runtime.test.ts      # Core runtime tests
├── pyodide-filesystem.test.ts   # File system tests
├── use-pyodide.test.tsx         # Hook tests
├── integration.test.tsx         # Integration tests
└── setup.js                     # Test setup
```

## Contributing

### Development Setup
1. Install dependencies: `pnpm install`
2. Start development server: `pnpm dev`
3. Run tests: `pnpm test`
4. Build for production: `pnpm build`

### Code Style
- Follow existing TypeScript patterns
- Use proper error handling
- Add comprehensive tests
- Document public APIs

### Submitting Changes
1. Create feature branch
2. Add tests for new functionality
3. Update documentation
4. Submit pull request

## Limitations

### Current Limitations
- No native binary packages (C extensions)
- Limited to packages available in Pyodide
- No subprocess support
- No file system access outside workspace
- Browser storage limitations

### Future Enhancements
- Code completion and IntelliSense
- Debugging support
- Git integration
- Collaborative editing
- More package support

## Resources

- [Pyodide Documentation](https://pyodide.org/en/stable/)
- [Python Package Index](https://pypi.org/)
- [WebAssembly](https://webassembly.org/)
- [xterm.js](https://xtermjs.org/)

## Support

For issues and questions:
1. Check this documentation
2. Review existing GitHub issues
3. Create new issue with reproduction steps
4. Contact development team
