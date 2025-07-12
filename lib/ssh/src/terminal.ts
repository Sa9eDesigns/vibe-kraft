/**
 * SSH Terminal integration with xterm.js
 */

import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ClientChannel } from 'ssh2';
import { EventEmitter } from 'events';
import { SSHClient } from './client';
import { SSHTerminalConfig } from './types';
import { createSSHError } from './errors';

export interface SSHTerminalOptions {
  theme?: 'light' | 'dark' | 'auto';
  fontSize?: number;
  fontFamily?: string;
  cursorBlink?: boolean;
  cursorStyle?: 'block' | 'underline' | 'bar';
  scrollback?: number;
  allowTransparency?: boolean;
  bellStyle?: 'none' | 'visual' | 'sound' | 'both';
}

export interface SSHTerminalEvents {
  data: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  key: (key: string, event: KeyboardEvent) => void;
  selection: (text: string) => void;
  title: (title: string) => void;
  bell: () => void;
  error: (error: Error) => void;
}

export class SSHTerminal extends EventEmitter {
  private terminal: Terminal;
  private fitAddon: FitAddon;
  private webLinksAddon: WebLinksAddon;
  private sshClient: SSHClient;
  private shell: ClientChannel | null = null;
  private container: HTMLElement | null = null;
  private isAttached = false;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    sshClient: SSHClient,
    options: SSHTerminalOptions = {}
  ) {
    super();
    
    this.sshClient = sshClient;
    
    // Create terminal with options
    this.terminal = new Terminal({
      theme: this.getTerminalTheme(options.theme || 'auto'),
      fontSize: options.fontSize || 14,
      fontFamily: options.fontFamily || 'Monaco, Menlo, "Ubuntu Mono", monospace',
      cursorBlink: options.cursorBlink !== false,
      cursorStyle: options.cursorStyle || 'block',
      scrollback: options.scrollback || 1000,
      allowTransparency: options.allowTransparency || false,
      // bellStyle: options.bellStyle || 'none', // Not available in current xterm version
      convertEol: true,
      disableStdin: false,
      macOptionIsMeta: true,
      rightClickSelectsWord: true,
      allowProposedApi: true
    });

    // Create addons
    this.fitAddon = new FitAddon();
    this.webLinksAddon = new WebLinksAddon();

    // Load addons
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(this.webLinksAddon);

    this.setupTerminalEventHandlers();
  }

  /**
   * Attach terminal to DOM element
   */
  attach(container: HTMLElement): void {
    if (this.isAttached) {
      throw createSSHError('Terminal is already attached', 'TERMINAL_ALREADY_ATTACHED');
    }

    this.container = container;
    this.terminal.open(container);
    this.isAttached = true;

    // Fit terminal to container
    this.fit();

    // Set up resize observer
    this.setupResizeObserver();

    // Focus terminal
    this.terminal.focus();
  }

  /**
   * Detach terminal from DOM
   */
  detach(): void {
    if (!this.isAttached) {
      return;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.terminal.dispose();
    this.isAttached = false;
    this.container = null;
  }

  /**
   * Connect to SSH shell
   */
  async connect(terminalConfig: SSHTerminalConfig = {}): Promise<void> {
    if (this.shell) {
      throw createSSHError('Terminal is already connected to a shell', 'TERMINAL_ALREADY_CONNECTED');
    }

    try {
      // Create shell with terminal dimensions
      const config: SSHTerminalConfig = {
        rows: this.terminal.rows,
        cols: this.terminal.cols,
        term: 'xterm-256color',
        ...terminalConfig
      };

      this.shell = await this.sshClient.createShell(config);
      this.setupShellEventHandlers();

      // Send initial resize
      this.sendResize();

      this.terminal.writeln('Connected to SSH server...');
      this.terminal.focus();

    } catch (error) {
      throw createSSHError(`Failed to connect terminal: ${error}`, 'TERMINAL_CONNECTION_ERROR');
    }
  }

  /**
   * Disconnect from SSH shell
   */
  async disconnect(): Promise<void> {
    if (!this.shell) {
      return;
    }

    try {
      this.shell.close();
      this.shell = null;
      this.terminal.writeln('\r\nConnection closed.');
    } catch (error) {
      throw createSSHError(`Failed to disconnect terminal: ${error}`, 'TERMINAL_DISCONNECTION_ERROR');
    }
  }

  /**
   * Write data to terminal
   */
  write(data: string): void {
    this.terminal.write(data);
  }

  /**
   * Write line to terminal
   */
  writeln(data: string): void {
    this.terminal.writeln(data);
  }

  /**
   * Clear terminal
   */
  clear(): void {
    this.terminal.clear();
  }

  /**
   * Reset terminal
   */
  reset(): void {
    this.terminal.reset();
  }

  /**
   * Fit terminal to container
   */
  fit(): void {
    if (this.isAttached) {
      this.fitAddon.fit();
      this.sendResize();
    }
  }

  /**
   * Resize terminal
   */
  resize(cols: number, rows: number): void {
    this.terminal.resize(cols, rows);
    this.sendResize();
  }

  /**
   * Get terminal dimensions
   */
  getDimensions(): { cols: number; rows: number } {
    return {
      cols: this.terminal.cols,
      rows: this.terminal.rows
    };
  }

  /**
   * Focus terminal
   */
  focus(): void {
    this.terminal.focus();
  }

  /**
   * Get selected text
   */
  getSelection(): string {
    return this.terminal.getSelection();
  }

  /**
   * Select all text
   */
  selectAll(): void {
    this.terminal.selectAll();
  }

  /**
   * Copy selection to clipboard
   */
  async copySelection(): Promise<void> {
    const selection = this.getSelection();
    if (selection && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(selection);
      } catch (error) {
        throw createSSHError(`Failed to copy to clipboard: ${error}`, 'CLIPBOARD_ERROR');
      }
    }
  }

  /**
   * Paste from clipboard
   */
  async paste(): Promise<void> {
    if (navigator.clipboard && this.shell) {
      try {
        const text = await navigator.clipboard.readText();
        this.shell.write(text);
      } catch (error) {
        throw createSSHError(`Failed to paste from clipboard: ${error}`, 'CLIPBOARD_ERROR');
      }
    }
  }

  /**
   * Set up terminal event handlers
   */
  private setupTerminalEventHandlers(): void {
    // Handle user input
    this.terminal.onData((data: string) => {
      if (this.shell) {
        this.shell.write(data);
      }
      this.emit('data', data);
    });

    // Handle key events
    this.terminal.onKey(({ key, domEvent }) => {
      this.emit('key', key, domEvent);
    });

    // Handle resize events
    this.terminal.onResize(({ cols, rows }) => {
      this.sendResize();
      this.emit('resize', cols, rows);
    });

    // Handle selection changes
    this.terminal.onSelectionChange(() => {
      const selection = this.getSelection();
      if (selection) {
        this.emit('selection', selection);
      }
    });

    // Handle title changes
    this.terminal.onTitleChange((title: string) => {
      this.emit('title', title);
    });

    // Handle bell
    this.terminal.onBell(() => {
      this.emit('bell');
    });
  }

  /**
   * Set up shell event handlers
   */
  private setupShellEventHandlers(): void {
    if (!this.shell) return;

    // Handle data from shell
    this.shell.on('data', (data: Buffer) => {
      this.terminal.write(data.toString());
    });

    // Handle shell close
    this.shell.on('close', () => {
      this.shell = null;
      this.terminal.writeln('\r\nShell session ended.');
    });

    // Handle shell errors
    this.shell.on('error', (error: Error) => {
      const sshError = createSSHError(`Shell error: ${error.message}`, 'SHELL_ERROR');
      this.emit('error', sshError);
    });
  }

  /**
   * Send resize signal to shell
   */
  private sendResize(): void {
    if (this.shell && this.shell.setWindow) {
      // setWindow requires 4 parameters: rows, cols, height, width
      this.shell.setWindow(this.terminal.rows, this.terminal.cols, 480, 640);
    }
  }

  /**
   * Set up resize observer for automatic fitting
   */
  private setupResizeObserver(): void {
    if (!this.container || !window.ResizeObserver) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      // Debounce resize events
      setTimeout(() => {
        this.fit();
      }, 100);
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * Get terminal theme based on preference
   */
  private getTerminalTheme(theme: 'light' | 'dark' | 'auto'): any {
    const darkTheme = {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
      cursorAccent: '#1e1e1e',
      selection: '#264f78',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#e5e5e5'
    };

    const lightTheme = {
      background: '#ffffff',
      foreground: '#333333',
      cursor: '#333333',
      cursorAccent: '#ffffff',
      selection: '#add6ff',
      black: '#000000',
      red: '#cd3131',
      green: '#00bc00',
      yellow: '#949800',
      blue: '#0451a5',
      magenta: '#bc05bc',
      cyan: '#0598bc',
      white: '#555555',
      brightBlack: '#666666',
      brightRed: '#cd3131',
      brightGreen: '#14ce14',
      brightYellow: '#b5ba00',
      brightBlue: '#0451a5',
      brightMagenta: '#bc05bc',
      brightCyan: '#0598bc',
      brightWhite: '#a5a5a5'
    };

    if (theme === 'auto') {
      // Detect system theme preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? darkTheme : lightTheme;
    }

    return theme === 'dark' ? darkTheme : lightTheme;
  }
}
