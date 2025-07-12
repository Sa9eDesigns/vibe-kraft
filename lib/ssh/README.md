# SSH Library for VibeKraft

A comprehensive TypeScript SSH client library with xterm.js integration for remote Ubuntu server connections. Built specifically for the VibeKraft WebVM platform.

## Features

- 🔐 **Multiple Authentication Methods**: Password, SSH keys, and SSH agent support
- 🖥️ **Terminal Integration**: Seamless xterm.js integration with real-time streaming
- 🔄 **Connection Management**: Connection pooling, automatic reconnection, and timeout handling
- ⚛️ **React Hooks**: Easy-to-use React hooks for SSH connections and terminals
- 🛡️ **Security**: Comprehensive security policies and validation
- 📝 **TypeScript**: Full TypeScript support with detailed type definitions
- 🔧 **Error Handling**: Robust error handling with recovery suggestions
- 🎯 **WebVM Compatible**: Designed to work seamlessly with existing WebVM components

## Installation

```bash
# Using pnpm (recommended)
pnpm add @vibe-kraft/ssh

# Using npm
npm install @vibe-kraft/ssh

# Using yarn
yarn add @vibe-kraft/ssh
```

## Quick Start

### Basic SSH Connection

```typescript
import { SSHClient, SSHConnectionConfig } from '@vibe-kraft/ssh';

const config: SSHConnectionConfig = {
  host: 'your-server.com',
  port: 22,
  auth: {
    type: 'password',
    username: 'ubuntu',
    password: 'your-password'
  }
};

const client = new SSHClient(config);

// Connect and execute a command
await client.connect();
const result = await client.executeCommand('ls -la');
console.log(result.stdout);

await client.disconnect();
```

### SSH Key Authentication

```typescript
import fs from 'fs';

const config: SSHConnectionConfig = {
  host: 'your-server.com',
  auth: {
    type: 'key',
    username: 'ubuntu',
    privateKey: fs.readFileSync('/path/to/private/key', 'utf8'),
    passphrase: 'optional-passphrase'
  }
};
```

### React Hook Usage

```typescript
import { useSSHConnection } from '@vibe-kraft/ssh';

function MyComponent() {
  const {
    client,
    state,
    isReady,
    error,
    connect,
    disconnect,
    executeCommand
  } = useSSHConnection(config, {
    autoConnect: true,
    onError: (error) => console.error('SSH Error:', error)
  });

  const handleCommand = async () => {
    if (isReady) {
      const result = await executeCommand('whoami');
      console.log('Current user:', result.stdout);
    }
  };

  return (
    <div>
      <p>Status: {state}</p>
      {error && <p>Error: {error.message}</p>}
      <button onClick={handleCommand} disabled={!isReady}>
        Execute Command
      </button>
    </div>
  );
}
```

### Terminal Integration

```typescript
import { useSSHConnection, useSSHTerminal } from '@vibe-kraft/ssh';
import { useRef, useEffect } from 'react';

function SSHTerminalComponent() {
  const terminalRef = useRef<HTMLDivElement>(null);
  
  const { client, isReady } = useSSHConnection(config, {
    autoConnect: true
  });
  
  const {
    terminal,
    attach,
    connect: connectTerminal,
    isConnected
  } = useSSHTerminal(client, {
    autoConnect: true,
    theme: 'dark'
  });

  useEffect(() => {
    if (terminalRef.current && terminal && !isConnected) {
      attach(terminalRef.current);
    }
  }, [terminal, attach, isConnected]);

  return (
    <div>
      <div ref={terminalRef} style={{ height: '400px', width: '100%' }} />
      <p>Terminal Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}
```

## API Reference

### SSHClient

The main SSH client class for establishing connections and executing commands.

#### Constructor

```typescript
new SSHClient(config: SSHConnectionConfig, options?: SSHClientOptions)
```

#### Methods

- `connect(): Promise<void>` - Connect to the SSH server
- `disconnect(): Promise<void>` - Disconnect from the SSH server
- `executeCommand(command: string, options?: SSHCommandOptions): Promise<SSHCommandResult>` - Execute a command
- `createShell(config?: SSHTerminalConfig): Promise<ClientChannel>` - Create an interactive shell

#### Properties

- `connectionState: SSHConnectionState` - Current connection state
- `isReady: boolean` - Whether the client is ready for commands
- `isConnected: boolean` - Whether the client is connected

### SSHTerminal

Terminal integration class for xterm.js.

#### Constructor

```typescript
new SSHTerminal(sshClient: SSHClient, options?: SSHTerminalOptions)
```

#### Methods

- `attach(container: HTMLElement): void` - Attach terminal to DOM element
- `detach(): void` - Detach terminal from DOM
- `connect(config?: SSHTerminalConfig): Promise<void>` - Connect to SSH shell
- `disconnect(): Promise<void>` - Disconnect from SSH shell
- `write(data: string): void` - Write data to terminal
- `clear(): void` - Clear terminal
- `fit(): void` - Fit terminal to container

### React Hooks

#### useSSHConnection

```typescript
const {
  client,
  state,
  isConnected,
  isReady,
  error,
  connect,
  disconnect,
  reconnect,
  executeCommand,
  connectionInfo
} = useSSHConnection(config, options);
```

#### useSSHTerminal

```typescript
const {
  terminal,
  isAttached,
  isConnected,
  dimensions,
  attach,
  detach,
  connect,
  disconnect,
  write,
  clear,
  fit,
  error
} = useSSHTerminal(sshClient, options);
```

## Configuration

### Connection Configuration

```typescript
interface SSHConnectionConfig {
  host: string;
  port?: number;
  auth: SSHAuthMethod;
  timeout?: number;
  keepaliveInterval?: number;
  keepaliveCountMax?: number;
  readyTimeout?: number;
  hostVerifier?: (keyHash: string, callback: (valid: boolean) => void) => void;
}
```

### Authentication Methods

#### Password Authentication

```typescript
{
  type: 'password',
  username: 'ubuntu',
  password: 'your-password'
}
```

#### SSH Key Authentication

```typescript
{
  type: 'key',
  username: 'ubuntu',
  privateKey: 'private-key-content',
  passphrase?: 'optional-passphrase'
}
```

#### SSH Agent Authentication

```typescript
{
  type: 'agent',
  username: 'ubuntu',
  agent?: '/path/to/ssh/agent/socket'
}
```

## Security

The library includes comprehensive security features:

- **Host Key Verification**: Validate server identity
- **Command Filtering**: Block dangerous commands
- **Rate Limiting**: Prevent brute force attacks
- **Strong Password Policies**: Enforce password complexity
- **Connection Timeouts**: Prevent hanging connections

### Security Policy

```typescript
import { SSHSecurityValidator } from '@vibe-kraft/ssh';

const validator = new SSHSecurityValidator({
  requireHostKeyVerification: true,
  allowDangerousCommands: false,
  maxConnectionTime: 3600000, // 1 hour
  requireStrongPasswords: true
});

// Validate before connecting
validator.validateConnection(config);
```

## Error Handling

The library provides detailed error information and recovery suggestions:

```typescript
import { 
  createSSHError, 
  isRecoverableError, 
  getUserFriendlyErrorMessage,
  getErrorRecoverySuggestions 
} from '@vibe-kraft/ssh';

try {
  await client.connect();
} catch (error) {
  if (isRecoverableError(error)) {
    console.log('Retrying connection...');
    // Implement retry logic
  } else {
    console.error('Connection failed:', getUserFriendlyErrorMessage(error));
    console.log('Suggestions:', getErrorRecoverySuggestions(error));
  }
}
```

## Integration with WebVM

This library is designed to work seamlessly with the existing WebVM components:

```typescript
import { useSSHConnection } from '@vibe-kraft/ssh';
import { SplitPanel } from '@/components/webvm';

function WebVMWithSSH() {
  const sshConnection = useSSHConnection(config);
  
  return (
    <SplitPanel>
      <WebVMTerminal />
      <SSHTerminalComponent connection={sshConnection} />
    </SplitPanel>
  );
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
