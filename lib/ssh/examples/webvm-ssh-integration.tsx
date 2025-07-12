/**
 * Example WebVM + SSH Integration Component
 * Shows how to integrate SSH terminals with existing WebVM workspace
 */

'use client';

import React, { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  X, 
  Server, 
  Terminal as TerminalIcon,
  Monitor,
  Settings
} from 'lucide-react';
import { SSHTerminalComponent } from './ssh-terminal-component';
import { SSHConnectionConfig } from '@vibe-kraft/ssh';

// Mock WebVM components (replace with actual imports)
const WebVMTerminal = () => (
  <div className="h-full bg-black text-green-400 p-4 font-mono">
    <div>WebVM Terminal</div>
    <div>user@webvm:~$ _</div>
  </div>
);

const WebVMFileExplorer = () => (
  <div className="h-full bg-muted p-4">
    <div className="text-sm font-medium mb-2">File Explorer</div>
    <div className="space-y-1 text-sm">
      <div>📁 home</div>
      <div>📁 var</div>
      <div>📁 etc</div>
      <div>📄 README.md</div>
    </div>
  </div>
);

interface SSHConnection {
  id: string;
  name: string;
  config: SSHConnectionConfig;
  connected: boolean;
}

export function WebVMSSHIntegration() {
  const [sshConnections, setSshConnections] = useState<SSHConnection[]>([]);
  const [activeTab, setActiveTab] = useState('webvm');
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: ''
  });

  const addSSHConnection = () => {
    if (!newConnection.name || !newConnection.host || !newConnection.username) {
      return;
    }

    const connection: SSHConnection = {
      id: `ssh-${Date.now()}`,
      name: newConnection.name,
      config: {
        host: newConnection.host,
        port: newConnection.port,
        auth: {
          type: 'password',
          username: newConnection.username,
          password: newConnection.password
        }
      },
      connected: false
    };

    setSshConnections(prev => [...prev, connection]);
    setActiveTab(connection.id);
    setShowAddConnection(false);
    setNewConnection({
      name: '',
      host: '',
      port: 22,
      username: '',
      password: ''
    });
  };

  const removeSSHConnection = (id: string) => {
    setSshConnections(prev => prev.filter(conn => conn.id !== id));
    if (activeTab === id) {
      setActiveTab('webvm');
    }
  };

  const updateConnectionStatus = (id: string, connected: boolean) => {
    setSshConnections(prev => 
      prev.map(conn => 
        conn.id === id ? { ...conn, connected } : conn
      )
    );
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">WebVM + SSH Workspace</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddConnection(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add SSH Connection
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <Card className="h-full rounded-none border-0 border-r">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">File Explorer</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <WebVMFileExplorer />
              </CardContent>
            </Card>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Terminals */}
          <ResizablePanel defaultSize={80}>
            <div className="h-full flex flex-col">
              {/* Terminal Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b px-4">
                  <TabsList className="h-auto p-0 bg-transparent">
                    {/* WebVM Tab */}
                    <TabsTrigger 
                      value="webvm" 
                      className="flex items-center space-x-2 data-[state=active]:bg-background"
                    >
                      <Monitor className="h-4 w-4" />
                      <span>WebVM</span>
                    </TabsTrigger>

                    {/* SSH Connection Tabs */}
                    {sshConnections.map(connection => (
                      <TabsTrigger 
                        key={connection.id}
                        value={connection.id}
                        className="flex items-center space-x-2 data-[state=active]:bg-background group"
                      >
                        <Server className="h-4 w-4" />
                        <span>{connection.name}</span>
                        <Badge 
                          variant={connection.connected ? "default" : "secondary"}
                          className="h-4 px-1 text-xs"
                        >
                          {connection.connected ? "●" : "○"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSSHConnection(connection.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Tab Content */}
                <div className="flex-1">
                  {/* WebVM Terminal */}
                  <TabsContent value="webvm" className="h-full m-0">
                    <Card className="h-full rounded-none border-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <TerminalIcon className="h-5 w-5" />
                          <CardTitle>WebVM Terminal</CardTitle>
                          <Badge variant="outline">Local</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 h-[calc(100%-80px)]">
                        <WebVMTerminal />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* SSH Terminal Tabs */}
                  {sshConnections.map(connection => (
                    <TabsContent 
                      key={connection.id}
                      value={connection.id} 
                      className="h-full m-0"
                    >
                      <SSHTerminalComponent
                        config={connection.config}
                        className="h-full rounded-none border-0"
                        onConnectionChange={(connected) => 
                          updateConnectionStatus(connection.id, connected)
                        }
                      />
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Add Connection Modal */}
      {showAddConnection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Add SSH Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Server"
                />
              </div>
              <div>
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={newConnection.host}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="server.example.com"
                />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, port: parseInt(e.target.value) || 22 }))}
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="ubuntu"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newConnection.password}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddConnection(false)}
                >
                  Cancel
                </Button>
                <Button onClick={addSSHConnection}>
                  Add Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
