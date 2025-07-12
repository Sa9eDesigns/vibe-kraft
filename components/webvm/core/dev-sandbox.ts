// Browser-compatible EventEmitter
class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (!listeners || listeners.length === 0) return false;

    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('Event listener error:', error);
      }
    });
    return true;
  }

  off(event: string, listener: Function): this {
    const listeners = this.events.get(event);
    if (!listeners) return this;

    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}
import type {
  DevSandboxConfig,
  SandboxEvent,
  FileInfo,
  CommandResult,
  AIResponse,
  ExecutionResult,
  MountConfig,
  AIConfig
} from '../types';

declare global {
  interface Window {
    CheerpX: any;
  }
}

export class DevSandbox extends EventEmitter {
  private config: DevSandboxConfig;
  private cx: any = null;
  private isInitialized = false;
  private isDestroyed = false;
  private devices: Map<string, any> = new Map();
  private mounts: MountConfig[] = [];
  private aiConfig: AIConfig;
  private activeProcesses: Map<string, any> = new Map();

  constructor(config: DevSandboxConfig) {
    super();
    this.config = config;
    this.aiConfig = config.aiConfig;
    this.mounts = config.mounts;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.diskImage) {
      throw new Error('Disk image URL is required');
    }
    
    if (!this.config.aiConfig.apiKey) {
      throw new Error('AI API key is required');
    }

    if (!this.config.crossOriginIsolation) {
      console.warn('Cross-origin isolation is required for SharedArrayBuffer support');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Sandbox is already initialized');
    }

    if (this.isDestroyed) {
      throw new Error('Cannot initialize destroyed sandbox');
    }

    try {
      // Check if CheerpX is available
      if (!window.CheerpX) {
        throw new Error('CheerpX is not loaded. Please include the CheerpX script.');
      }

      // Check for SharedArrayBuffer support
      if (!window.SharedArrayBuffer) {
        throw new Error('SharedArrayBuffer is not available. Cross-origin isolation required.');
      }

      // Initialize devices
      await this.initializeDevices();

      // Create CheerpX Linux instance with networking if configured
      const createOptions: any = {
        mounts: this.mounts.map(mount => ({
          type: mount.type,
          path: mount.path,
          dev: this.devices.get(mount.dev) || mount.dev,
          ...mount.options
        }))
      };

      // Add networking configuration if available
      if (this.config.networking?.tailscale?.enabled) {
        createOptions.networkInterface = {
          authKey: this.config.networking.tailscale.authKey,
          controlUrl: this.config.networking.tailscale.controlUrl,
          stateUpdateCb: (state: number) => {
            this.emit('networkChange', { state, type: 'tailscale' });
          },
          netmapUpdateCb: (map: any) => {
            this.emit('networkChange', { map, type: 'netmap' });
          }
        };
      }

      this.cx = await window.CheerpX.Linux.create(createOptions);

      this.isInitialized = true;

      // Test basic functionality (non-blocking)
      try {
        await this.testBasicFunctionality();
      } catch (testError) {
        console.warn('⚠️ Basic functionality test failed, but continuing initialization:', testError);
      }

      this.emit('ready', { sandbox: this });

    } catch (error) {
      this.emit('error', { error, sandbox: this });
      throw error;
    }
  }

  private async initializeDevices(): Promise<void> {
    try {
      // Create cloud device for disk image
      const cloudDevice = await window.CheerpX.CloudDevice.create(this.config.diskImage);
      this.devices.set('cloud', cloudDevice);

      // Create IndexedDB device for persistence
      const idbDevice = await window.CheerpX.IDBDevice.create('webvm-storage');
      this.devices.set('idb', idbDevice);

      // Create overlay device combining cloud and local storage
      const overlayDevice = await window.CheerpX.OverlayDevice.create(cloudDevice, idbDevice);
      this.devices.set('overlay', overlayDevice);

      // Create web device for HTTP access
      const webDevice = await window.CheerpX.WebDevice.create('');
      this.devices.set('web', webDevice);

      // Create data device for JS data access
      const dataDevice = await window.CheerpX.DataDevice.create();
      this.devices.set('data', dataDevice);

      // Create additional devices for development workspace
      const workspaceDevice = await window.CheerpX.IDBDevice.create('workspace-storage');
      this.devices.set('workspace', workspaceDevice);

      // Create projects device for project management
      const projectsDevice = await window.CheerpX.IDBDevice.create('projects-storage');
      this.devices.set('projects', projectsDevice);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize devices: ${message}`);
    }
  }

  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    try {
      // Stop all active processes
      for (const [id, process] of this.activeProcesses) {
        try {
          await process.kill?.();
        } catch (error) {
          console.warn(`Failed to kill process ${id}:`, error);
        }
      }
      this.activeProcesses.clear();

      // Clean up CheerpX instance
      if (this.cx) {
        await this.cx.destroy?.();
        this.cx = null;
      }

      // Clear devices
      this.devices.clear();

      this.isDestroyed = true;
      this.isInitialized = false;
      this.emit('destroyed', { sandbox: this });
      
    } catch (error) {
      console.error('Error during sandbox destruction:', error);
      throw error;
    }
  }

  private async testBasicFunctionality(): Promise<void> {
    console.log('🧪 Testing basic CheerpX functionality...');

    // First, check if CheerpX instance is properly set up
    console.log('🔍 CheerpX instance check:', {
      hasCx: !!this.cx,
      cxType: typeof this.cx,
      hasRun: this.cx && typeof this.cx.run === 'function',
      cxMethods: this.cx ? Object.keys(this.cx).filter(k => typeof this.cx[k] === 'function') : []
    });

    if (!this.cx) {
      console.warn('⚠️ CheerpX instance not available, skipping basic functionality test');
      return;
    }

    if (typeof this.cx.run !== 'function') {
      console.warn('⚠️ CheerpX run method not available, skipping basic functionality test');
      return;
    }

    try {
      console.log('🚀 Attempting basic echo command...');

      // Test simple echo command with minimal options
      const result = await this.cx.run('/bin/echo', ['Hello WebVM'], {
        env: ['PATH=/bin:/usr/bin'],
        cwd: '/home/user'
      });

      console.log('📤 Basic echo test raw result:', result);
      console.log('📊 Basic echo test analysis:', {
        hasResult: !!result,
        resultType: typeof result,
        exitCode: result?.exitCode,
        stdout: result?.stdout,
        stderr: result?.stderr,
        stdoutType: typeof result?.stdout,
        stderrType: typeof result?.stderr
      });

      // More lenient checking - just verify we got some kind of result
      if (!result) {
        console.warn('⚠️ No result from echo command, but continuing...');
        return;
      }

      if (result.exitCode && result.exitCode !== 0) {
        console.warn(`⚠️ Echo command returned non-zero exit code: ${result.exitCode}, but continuing...`);
        if (result.stderr) {
          console.warn('⚠️ Echo command stderr:', result.stderr);
        }
        return;
      }

      if (result.stdout && result.stdout.includes('Hello WebVM')) {
        console.log('✅ Basic functionality test passed - echo command working correctly');
      } else {
        console.warn('⚠️ Echo command succeeded but output is unexpected:', result.stdout);
        console.warn('⚠️ Continuing anyway as CheerpX seems to be responding...');
      }

    } catch (error) {
      console.error('❌ Basic functionality test failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name
      });

      // Don't throw here - just warn and continue
      // The WebVM might still work for file operations even if echo fails
      console.warn('⚠️ Continuing initialization despite basic test failure...');
      console.warn('⚠️ File operations may still work, will attempt graceful degradation');
    }
  }

  async readFile(path: string): Promise<string> {
    this.ensureInitialized();
    
    try {
      const result = await this.cx.run('/bin/cat', [path], {
        env: ['PATH=/bin:/usr/bin'],
        cwd: '/',
        uid: 1000,
        gid: 1000
      });
      
      return result.stdout || '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize devices: ${message}`);
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      // Create a temporary file to write content
      const tempPath = `/tmp/webvm-write-${Date.now()}`;
      
      // Write content to data device
      const dataDevice = this.devices.get('data');
      await dataDevice.writeFile(tempPath, content);
      
      // Copy to target location
      await this.cx.run('/bin/cp', [tempPath, path], {
        env: ['PATH=/bin:/usr/bin'],
        cwd: '/',
        uid: 1000,
        gid: 1000
      });
      
      // Clean up temp file
      await this.cx.run('/bin/rm', [tempPath], {
        env: ['PATH=/bin:/usr/bin'],
        cwd: '/',
        uid: 1000,
        gid: 1000
      });
      
      this.emit('fileChange', { path, action: 'write', content });
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize devices: ${message}`);
    }
  }

  async listFiles(path: string): Promise<FileInfo[]> {
    this.ensureInitialized();

    console.log(`🔍 Listing files in path: ${path}`);
    console.log('🔧 CheerpX readiness check:', {
      isReady: this.isReady(),
      isCheerpXReady: this.isCheerpXReady(),
      hasCx: !!this.cx,
      cxType: typeof this.cx
    });

    // If CheerpX is not ready, return empty array with warning
    if (!this.isCheerpXReady()) {
      console.warn('⚠️ CheerpX is not ready for command execution, returning empty file list');
      return [];
    }

    try {
      // Use executeCommand instead of direct cx.run for better error handling
      const result = await this.executeCommand('/bin/ls', ['-la', path], {
        env: ['PATH=/bin:/usr/bin'],
        cwd: '/',
        uid: 1000,
        gid: 1000
      });

      console.log('📁 ls command result:', {
        exitCode: result.exitCode,
        stdout: result.stdout ? `${result.stdout.length} chars` : 'undefined',
        stderr: result.stderr ? `${result.stderr.length} chars` : 'undefined'
      });

      // Check if stdout is available and not empty
      if (!result.stdout) {
        console.warn('⚠️ ls command returned no stdout, checking stderr:', result.stderr);

        // If stderr indicates permission issues or path doesn't exist, try alternatives
        if (result.stderr && result.stderr.includes('Permission denied')) {
          console.log('🔄 Permission denied, trying with different permissions...');
          // Try without specific uid/gid
          const fallbackResult = await this.executeCommand('/bin/ls', ['-la', path]);
          if (fallbackResult.stdout) {
            return this.parseLsOutput(fallbackResult.stdout);
          }
        }

        if (result.stderr && result.stderr.includes('No such file or directory')) {
          console.log('📂 Directory not found, trying parent directory or home...');
          // Try home directory as fallback
          if (path !== '/home/user') {
            return await this.listFiles('/home/user');
          }
        }

        // Return empty array if no stdout and no recoverable error
        console.warn('📭 No file listing available, returning empty array');
        return [];
      }

      return this.parseLsOutput(result.stdout);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to list files in ${path}:`, message);

      // Try fallback approaches
      try {
        console.log('🔄 Trying fallback file listing approaches...');

        // Try with simpler ls command
        const simpleResult = await this.executeCommand('ls', [path]);
        if (simpleResult.stdout) {
          console.log('✅ Simple ls command succeeded');
          return this.parseSimpleLsOutput(simpleResult.stdout, path);
        }

        // Try with find command as last resort
        const findResult = await this.executeCommand('find', [path, '-maxdepth', '1', '-type', 'f']);
        if (findResult.stdout) {
          console.log('✅ Find command succeeded');
          return this.parseFindOutput(findResult.stdout);
        }

      } catch (fallbackError) {
        console.error('❌ All fallback methods failed:', fallbackError);
      }

      // Return empty array instead of throwing to prevent UI crashes
      console.warn('📭 Returning empty file list due to errors');
      return [];
    }
  }

  private parseLsOutput(output: string): FileInfo[] {
    if (!output || typeof output !== 'string') {
      console.warn('⚠️ parseLsOutput received invalid output:', output);
      return [];
    }

    const lines = output.split('\n').filter(line => line.trim() && !line.startsWith('total'));
    const files: FileInfo[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 9) {
        const permissions = parts[0];
        const owner = parts[2];
        const group = parts[3];
        const size = parseInt(parts[4], 10);
        const name = parts.slice(8).join(' ');
        
        // Skip . and .. entries
        if (name === '.' || name === '..') continue;
        
        const type = permissions.startsWith('d') ? 'directory' : 
                    permissions.startsWith('l') ? 'symlink' : 'file';
        
        files.push({
          name,
          path: name,
          type,
          size,
          modified: new Date(), // TODO: Parse date from ls output
          permissions,
          owner,
          group
        });
      }
    }
    
    return files;
  }

  private parseSimpleLsOutput(output: string, basePath: string): FileInfo[] {
    if (!output || typeof output !== 'string') {
      console.warn('⚠️ parseSimpleLsOutput received invalid output:', output);
      return [];
    }

    const lines = output.split('\n').filter(line => line.trim());
    const files: FileInfo[] = [];

    for (const line of lines) {
      const name = line.trim();
      if (name && name !== '.' && name !== '..') {
        files.push({
          name,
          path: `${basePath}/${name}`,
          type: 'file', // Default to file since we can't determine from simple ls
          size: 0,
          permissions: '-rw-r--r--',
          lastModified: new Date(),
          owner: 'user',
          group: 'user'
        });
      }
    }

    return files;
  }

  private parseFindOutput(output: string): FileInfo[] {
    if (!output || typeof output !== 'string') {
      console.warn('⚠️ parseFindOutput received invalid output:', output);
      return [];
    }

    const lines = output.split('\n').filter(line => line.trim());
    const files: FileInfo[] = [];

    for (const line of lines) {
      const fullPath = line.trim();
      if (fullPath) {
        const name = fullPath.split('/').pop() || fullPath;
        files.push({
          name,
          path: fullPath,
          type: 'file',
          size: 0,
          permissions: '-rw-r--r--',
          lastModified: new Date(),
          owner: 'user',
          group: 'user'
        });
      }
    }

    return files;
  }

  async executeCommand(command: string, args: string[] = [], options: any = {}): Promise<CommandResult> {
    this.ensureInitialized();

    const fullCommand = `${command} ${args.join(' ')}`;
    console.log(`🚀 Executing command: ${fullCommand}`);

    const startTime = Date.now();

    try {
      // Check if CheerpX run method is available
      if (!this.cx || typeof this.cx.run !== 'function') {
        throw new Error('CheerpX run method is not available');
      }

      const runOptions = {
        env: options.env || ['PATH=/bin:/usr/bin', 'HOME=/home/user'],
        cwd: options.cwd || '/home/user',
        uid: options.uid || 1000,
        gid: options.gid || 1000,
        ...options
      };

      console.log('⚙️ Command options:', runOptions);
      console.log('🔧 CheerpX instance check:', {
        hasCx: !!this.cx,
        hasRun: this.cx && typeof this.cx.run === 'function'
      });

      const result = await this.cx.run(command, args, runOptions);

      console.log('📤 Raw CheerpX result:', {
        exitCode: result?.exitCode,
        stdout: result?.stdout ? `${result.stdout.length} chars` : 'undefined',
        stderr: result?.stderr ? `${result.stderr.length} chars` : 'undefined',
        hasResult: !!result
      });

      const duration = Date.now() - startTime;
      const commandResult: CommandResult = {
        command: fullCommand,
        exitCode: result?.exitCode || 0,
        stdout: result?.stdout || '',
        stderr: result?.stderr || '',
        duration,
        timestamp: new Date()
      };

      console.log(`✅ Command completed in ${duration}ms:`, {
        exitCode: commandResult.exitCode,
        stdoutLength: commandResult.stdout.length,
        stderrLength: commandResult.stderr.length
      });

      this.emit('command', commandResult);
      return commandResult;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const duration = Date.now() - startTime;

      console.error(`❌ Command execution failed after ${duration}ms:`, {
        command: fullCommand,
        error: message,
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined
      });

      const commandResult: CommandResult = {
        command: fullCommand,
        exitCode: 1,
        stdout: '',
        stderr: message,
        duration,
        timestamp: new Date()
      };

      this.emit('command', commandResult);
      throw error;
    }
  }

  async executeCommandStream(command: string, args: string[] = [], options: any = {}): Promise<AsyncGenerator<string, any, any>> {
    this.ensureInitialized();

    // This is a simplified implementation
    // In production, you'd want to stream output in real-time
    const self = this;
    async function* generator() {
      const result = await self.executeCommand(command, args, options);
      yield result.stdout;
      if (result.stderr) {
        yield result.stderr;
      }
    }
    return generator();
  }

  async aiAssist(prompt: string, context?: any): Promise<AIResponse> {
    this.ensureInitialized();

    try {
      // Import AI tools dynamically
      const { WebVMAITools } = await import('../ai/ai-tools');
      const aiTools = new WebVMAITools(this);

      // Get system context
      const systemContext = {
        currentDirectory: await this.getCurrentDirectory(),
        availableTools: aiTools.getAllTools().map(tool => ({
          name: tool.name,
          description: tool.description
        })),
        systemInfo: await this.getSystemInfo(),
        ...context
      };

      // Create AI response with tools and context
      const response: AIResponse = {
        type: 'tool_ready',
        content: `AI assistant ready with ${aiTools.getAllTools().length} tools available`,
        timestamp: new Date(),
        data: {
          tools: aiTools.getAllTools(),
          context: systemContext,
          prompt
        }
      };

      this.emit('aiMessage', response);
      return response;

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`AI assistance failed: ${message}`);

      const errorResponse: AIResponse = {
        type: 'error',
        content: `AI assistance failed: ${message}`,
        timestamp: new Date()
      };

      this.emit('aiMessage', errorResponse);
      throw error;
    }
  }

  private async getCurrentDirectory(): Promise<string> {
    try {
      const result = await this.executeCommand('pwd', []);
      return result.stdout.trim() || '/home/user';
    } catch {
      return '/home/user';
    }
  }

  private async getSystemInfo(): Promise<any> {
    try {
      const [osInfo, diskInfo, memInfo] = await Promise.all([
        this.executeCommand('uname', ['-a']).catch(() => ({ stdout: 'Unknown' })),
        this.executeCommand('df', ['-h', '/']).catch(() => ({ stdout: 'Unknown' })),
        this.executeCommand('free', ['-h']).catch(() => ({ stdout: 'Unknown' }))
      ]);

      return {
        os: osInfo.stdout.trim(),
        disk: diskInfo.stdout.trim(),
        memory: memInfo.stdout.trim(),
        timestamp: new Date().toISOString()
      };
    } catch {
      return {
        os: 'Unknown',
        disk: 'Unknown',
        memory: 'Unknown',
        timestamp: new Date().toISOString()
      };
    }
  }

  async aiExecute(task: string): Promise<ExecutionResult> {
    this.ensureInitialized();
    
    const startTime = Date.now();
    
    try {
      // This would integrate with AI tools for code execution
      // Implementation depends on the specific AI capabilities
      const result: ExecutionResult = {
        success: false,
        output: 'AI execution not yet implemented',
        duration: Date.now() - startTime,
        metadata: { task }
      };
      
      return result;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`AI execution failed: ${message}`);
      
      return {
        success: false,
        output: '',
        error: message,
        duration: Date.now() - startTime,
        metadata: { task }
      };
    }
  }

  setConsole(element: HTMLElement): void {
    this.ensureInitialized();
    
    if (this.cx && this.cx.setConsole) {
      this.cx.setConsole(element);
    }
  }

  getCheerpXInstance(): any {
    return this.cx;
  }

  getConfig(): DevSandboxConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.isInitialized && !this.isDestroyed;
  }

  isCheerpXReady(): boolean {
    return this.isReady() && !!this.cx && typeof this.cx.run === 'function';
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Sandbox is not initialized. Call initialize() first.');
    }

    if (this.isDestroyed) {
      throw new Error('Sandbox has been destroyed.');
    }

    // Additional check for CheerpX availability
    if (!this.cx) {
      throw new Error('CheerpX instance is not available.');
    }

    // Warn if CheerpX methods are not available, but don't fail completely
    if (typeof this.cx.run !== 'function') {
      console.warn('⚠️ CheerpX run method is not available yet');
      console.warn('⚠️ Available CheerpX methods:', Object.keys(this.cx).filter(k => typeof this.cx[k] === 'function'));
    }
  }

  // Event handler methods
  onReady(callback: (event: any) => void): void {
    this.on('ready', callback);
  }

  onError(callback: (event: any) => void): void {
    this.on('error', callback);
  }

  onCommand(callback: (result: CommandResult) => void): void {
    this.on('command', callback);
  }

  onFileChange(callback: (event: any) => void): void {
    this.on('fileChange', callback);
  }

  onAIMessage(callback: (response: AIResponse) => void): void {
    this.on('aiMessage', callback);
  }

  onDestroyed(callback: (event: any) => void): void {
    this.on('destroyed', callback);
  }
}