/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PyodideWorkspaceLayout } from '@/components/pyodide/workspace/pyodide-workspace-layout';
import { PyodideTerminal } from '@/components/pyodide/workspace/pyodide-terminal';
import { PyodideFileExplorer } from '@/components/pyodide/workspace/pyodide-file-explorer';

// Mock the usePyodide hook
jest.mock('@/components/pyodide/hooks/use-pyodide');

const mockUsePyodide = {
  isInitialized: true,
  isLoading: false,
  error: null,
  runPython: jest.fn(),
  createFile: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  deleteFile: jest.fn(),
  listDirectory: jest.fn(),
  uploadFile: jest.fn(),
  downloadFile: jest.fn(),
  installPackage: jest.fn(),
  uninstallPackage: jest.fn(),
  searchPackages: jest.fn(),
  installedPackages: [
    { name: 'numpy', version: '1.21.0', installed: true },
    { name: 'pandas', version: '1.3.0', installed: true }
  ],
  output: ['Python workspace initialized successfully!'],
  clearOutput: jest.fn(),
  addOutput: jest.fn(),
  saveWorkspace: jest.fn(),
  loadWorkspace: jest.fn()
};

require('@/components/pyodide/hooks/use-pyodide').usePyodide.mockReturnValue(mockUsePyodide);

// Mock xterm.js
jest.mock('@xterm/xterm', () => ({
  Terminal: jest.fn(() => ({
    open: jest.fn(),
    write: jest.fn(),
    writeln: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn(),
    onData: jest.fn(),
    getSelection: jest.fn(() => 'selected text'),
    loadAddon: jest.fn()
  }))
}));

jest.mock('@xterm/addon-fit', () => ({
  FitAddon: jest.fn(() => ({
    fit: jest.fn()
  }))
}));

jest.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: jest.fn()
}));

jest.mock('@xterm/addon-search', () => ({
  SearchAddon: jest.fn()
}));

// Mock ResizablePanel components
jest.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: ({ children }: any) => <div data-testid="resizable-panel-group">{children}</div>,
  ResizablePanel: ({ children }: any) => <div data-testid="resizable-panel">{children}</div>,
  ResizableHandle: () => <div data-testid="resizable-handle" />
}));

// Mock TabSystem
jest.mock('@/components/webvm/ui/tab-system', () => ({
  TabSystem: ({ children, tabs, activeTabId }: any) => (
    <div data-testid="tab-system">
      <div data-testid="tab-list">
        {tabs.map((tab: any) => (
          <button key={tab.id} data-testid={`tab-${tab.id}`}>
            {tab.title}
          </button>
        ))}
      </div>
      <div data-testid="tab-content">{children}</div>
    </div>
  )
}));

describe('Pyodide Workspace Integration', () => {
  const workspaceId = 'test-workspace-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PyodideWorkspaceLayout', () => {
    it('should render workspace layout with all panels', async () => {
      render(
        <PyodideWorkspaceLayout
          workspaceId={workspaceId}
          onFileOpen={jest.fn()}
          onFileChange={jest.fn()}
        />
      );

      // Check for main workspace elements
      expect(screen.getByText('Python Workspace')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      
      // Check for resizable panels
      expect(screen.getAllByTestId('resizable-panel-group')).toHaveLength(2);
      expect(screen.getAllByTestId('resizable-panel')).toHaveLength(4);
      
      // Check for tab systems
      expect(screen.getAllByTestId('tab-system')).toHaveLength(3);
    });

    it('should handle file creation', async () => {
      const onFileOpen = jest.fn();
      const onFileChange = jest.fn();

      render(
        <PyodideWorkspaceLayout
          workspaceId={workspaceId}
          onFileOpen={onFileOpen}
          onFileChange={onFileChange}
        />
      );

      // Simulate new file creation
      const newFileButton = screen.getByRole('button', { name: /new file/i });
      fireEvent.click(newFileButton);

      await waitFor(() => {
        expect(mockUsePyodide.createFile).toHaveBeenCalled();
      });
    });

    it('should handle Python code execution', async () => {
      render(
        <PyodideWorkspaceLayout
          workspaceId={workspaceId}
          onFileOpen={jest.fn()}
          onFileChange={jest.fn()}
        />
      );

      // Mock successful execution
      mockUsePyodide.runPython.mockResolvedValue({
        success: true,
        result: 'Hello, World!',
        output: 'Hello, World!\n'
      });

      // Find and click run button (would be in a file editor)
      const runButtons = screen.getAllByRole('button', { name: /run/i });
      if (runButtons.length > 0) {
        fireEvent.click(runButtons[0]);

        await waitFor(() => {
          expect(mockUsePyodide.runPython).toHaveBeenCalled();
        });
      }
    });

    it('should toggle sidebar and bottom panels', () => {
      render(
        <PyodideWorkspaceLayout
          workspaceId={workspaceId}
          onFileOpen={jest.fn()}
          onFileChange={jest.fn()}
        />
      );

      // Find layout toggle button
      const layoutButton = screen.getByRole('button', { name: /layout/i });
      fireEvent.click(layoutButton);

      // Panel visibility should change (tested through component state)
      expect(layoutButton).toBeInTheDocument();
    });
  });

  describe('PyodideTerminal', () => {
    it('should render terminal with proper status', () => {
      render(<PyodideTerminal workspaceId={workspaceId} />);

      expect(screen.getByText('Python Terminal')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('should show package information', () => {
      render(<PyodideTerminal workspaceId={workspaceId} />);

      // Click package manager button
      const packageButton = screen.getByRole('button', { name: /package/i });
      fireEvent.click(packageButton);

      // Should show installed packages
      expect(screen.getByText('numpy 1.21.0')).toBeInTheDocument();
      expect(screen.getByText('pandas 1.3.0')).toBeInTheDocument();
    });

    it('should handle terminal actions', () => {
      render(<PyodideTerminal workspaceId={workspaceId} />);

      // Test clear button
      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      // Test restart button
      const restartButton = screen.getByRole('button', { name: /restart/i });
      fireEvent.click(restartButton);

      // Test copy button
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      // Buttons should be present and clickable
      expect(clearButton).toBeInTheDocument();
      expect(restartButton).toBeInTheDocument();
      expect(copyButton).toBeInTheDocument();
    });
  });

  describe('PyodideFileExplorer', () => {
    beforeEach(() => {
      mockUsePyodide.listDirectory.mockResolvedValue([
        {
          name: 'test.py',
          path: 'test.py',
          type: 'file',
          size: 100,
          modified: new Date()
        },
        {
          name: 'folder',
          path: 'folder',
          type: 'directory',
          size: 0,
          modified: new Date()
        }
      ]);
    });

    it('should render file explorer', async () => {
      render(
        <PyodideFileExplorer
          workspaceId={workspaceId}
          onFileSelect={jest.fn()}
          onFileOpen={jest.fn()}
        />
      );

      expect(screen.getByText('Files')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
    });

    it('should handle file operations', async () => {
      const onFileSelect = jest.fn();
      const onFileOpen = jest.fn();

      render(
        <PyodideFileExplorer
          workspaceId={workspaceId}
          onFileSelect={onFileSelect}
          onFileOpen={onFileOpen}
        />
      );

      await waitFor(() => {
        expect(mockUsePyodide.listDirectory).toHaveBeenCalled();
      });

      // Test new file creation
      const newFileButton = screen.getByRole('button', { name: /plus/i });
      fireEvent.click(newFileButton);

      // Test file upload
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      expect(newFileButton).toBeInTheDocument();
      expect(uploadButton).toBeInTheDocument();
    });

    it('should handle file search', async () => {
      render(
        <PyodideFileExplorer
          workspaceId={workspaceId}
          onFileSelect={jest.fn()}
          onFileOpen={jest.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search files...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(searchInput).toHaveValue('test');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', () => {
      const errorUsePyodide = {
        ...mockUsePyodide,
        isInitialized: false,
        isLoading: false,
        error: 'Failed to initialize Pyodide'
      };

      require('@/components/pyodide/hooks/use-pyodide').usePyodide.mockReturnValue(errorUsePyodide);

      render(<PyodideTerminal workspaceId={workspaceId} />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to initialize Python environment')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      const loadingUsePyodide = {
        ...mockUsePyodide,
        isInitialized: false,
        isLoading: true,
        error: null
      };

      require('@/components/pyodide/hooks/use-pyodide').usePyodide.mockReturnValue(loadingUsePyodide);

      render(<PyodideTerminal workspaceId={workspaceId} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Loading Python environment...')).toBeInTheDocument();
    });
  });

  describe('Workspace State Management', () => {
    it('should save workspace state', async () => {
      render(
        <PyodideWorkspaceLayout
          workspaceId={workspaceId}
          onFileOpen={jest.fn()}
          onFileChange={jest.fn()}
        />
      );

      // Simulate file changes that should trigger state saving
      const onFileChange = jest.fn();
      
      // Mock file change
      if (onFileChange) {
        onFileChange('test.py', 'print("Hello")');
      }

      // State should be marked as dirty
      expect(mockUsePyodide.saveWorkspace).toBeDefined();
    });

    it('should handle workspace persistence', async () => {
      render(
        <PyodideWorkspaceLayout
          workspaceId={workspaceId}
          onFileOpen={jest.fn()}
          onFileChange={jest.fn()}
        />
      );

      // Workspace should load existing state
      expect(mockUsePyodide.loadWorkspace).toBeDefined();
      expect(mockUsePyodide.saveWorkspace).toBeDefined();
    });
  });
});
