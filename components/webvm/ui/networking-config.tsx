'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, 
  Wifi, 
  WifiOff, 
  Shield, 
  Globe, 
  Server,
  Key,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import type { NetworkingConfig } from '../types';

interface NetworkingConfigProps {
  config: NetworkingConfig;
  onChange: (config: NetworkingConfig) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  connectionStatus?: 'disconnected' | 'connecting' | 'connected' | 'error';
  className?: string;
}

export function NetworkingConfig({
  config,
  onChange,
  onConnect,
  onDisconnect,
  connectionStatus = 'disconnected',
  className
}: NetworkingConfigProps) {
  const [tailscaleConfig, setTailscaleConfig] = useState(config.tailscale || {
    enabled: false,
    authKey: '',
    controlUrl: '',
    exitNode: '',
    routes: []
  });

  const [sshConfig, setSshConfig] = useState(config.ssh || {
    enabled: false,
    keyPath: '',
    knownHosts: []
  });

  const [portForwardingConfig, setPortForwardingConfig] = useState(config.portForwarding || {
    enabled: false,
    ports: []
  });

  const [newRoute, setNewRoute] = useState('');
  const [newPort, setNewPort] = useState({ local: '', remote: '', protocol: 'tcp' });

  useEffect(() => {
    onChange({
      tailscale: tailscaleConfig,
      ssh: sshConfig,
      portForwarding: portForwardingConfig
    });
  }, [tailscaleConfig, sshConfig, portForwardingConfig, onChange]);

  const handleTailscaleToggle = (enabled: boolean) => {
    setTailscaleConfig(prev => ({ ...prev, enabled }));
  };

  const handleAuthKeyChange = (authKey: string) => {
    setTailscaleConfig(prev => ({ ...prev, authKey }));
  };

  const addRoute = () => {
    if (newRoute.trim()) {
      setTailscaleConfig(prev => ({
        ...prev,
        routes: [...(prev.routes || []), newRoute.trim()]
      }));
      setNewRoute('');
    }
  };

  const removeRoute = (index: number) => {
    setTailscaleConfig(prev => ({
      ...prev,
      routes: prev.routes?.filter((_, i) => i !== index) || []
    }));
  };

  const addPortMapping = () => {
    if (newPort.local && newPort.remote) {
      setPortForwardingConfig(prev => ({
        ...prev,
        ports: [...prev.ports, {
          local: parseInt(newPort.local),
          remote: parseInt(newPort.remote),
          protocol: newPort.protocol as 'tcp' | 'udp'
        }]
      }));
      setNewPort({ local: '', remote: '', protocol: 'tcp' });
    }
  };

  const removePortMapping = (index: number) => {
    setPortForwardingConfig(prev => ({
      ...prev,
      ports: prev.ports.filter((_, i) => i !== index)
    }));
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network Configuration
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'} className="ml-auto">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tailscale" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tailscale">Tailscale VPN</TabsTrigger>
            <TabsTrigger value="ssh">SSH Access</TabsTrigger>
            <TabsTrigger value="ports">Port Forwarding</TabsTrigger>
          </TabsList>

          <TabsContent value="tailscale" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Tailscale VPN</Label>
                <p className="text-sm text-muted-foreground">
                  Connect to your Tailscale network for secure remote access
                </p>
              </div>
              <Switch
                checked={tailscaleConfig.enabled}
                onCheckedChange={handleTailscaleToggle}
              />
            </div>

            {tailscaleConfig.enabled && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="authKey">Auth Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="authKey"
                      type="password"
                      placeholder="tskey-auth-..."
                      value={tailscaleConfig.authKey}
                      onChange={(e) => handleAuthKeyChange(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(tailscaleConfig.authKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generate an auth key from your Tailscale admin console
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="controlUrl">Control URL (Optional)</Label>
                  <Input
                    id="controlUrl"
                    placeholder="https://controlplane.tailscale.com"
                    value={tailscaleConfig.controlUrl || ''}
                    onChange={(e) => setTailscaleConfig(prev => ({ ...prev, controlUrl: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitNode">Exit Node (Optional)</Label>
                  <Input
                    id="exitNode"
                    placeholder="100.64.0.1"
                    value={tailscaleConfig.exitNode || ''}
                    onChange={(e) => setTailscaleConfig(prev => ({ ...prev, exitNode: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subnet Routes</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="192.168.1.0/24"
                      value={newRoute}
                      onChange={(e) => setNewRoute(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addRoute()}
                    />
                    <Button onClick={addRoute} variant="outline">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tailscaleConfig.routes?.map((route, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeRoute(index)}>
                        {route} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={onConnect} 
                    disabled={!tailscaleConfig.authKey || connectionStatus === 'connecting'}
                    className="flex-1"
                  >
                    {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                  </Button>
                  {connectionStatus === 'connected' && (
                    <Button onClick={onDisconnect} variant="outline">
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ssh" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable SSH Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow SSH connections to the WebVM instance
                </p>
              </div>
              <Switch
                checked={sshConfig.enabled}
                onCheckedChange={(enabled) => setSshConfig(prev => ({ ...prev, enabled }))}
              />
            </div>

            {sshConfig.enabled && (
              <div className="space-y-4">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    SSH access requires Tailscale VPN to be enabled for secure connectivity.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="keyPath">SSH Key Path</Label>
                  <Input
                    id="keyPath"
                    placeholder="/home/user/.ssh/id_rsa.pub"
                    value={sshConfig.keyPath}
                    onChange={(e) => setSshConfig(prev => ({ ...prev, keyPath: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ports" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Port Forwarding</Label>
                <p className="text-sm text-muted-foreground">
                  Forward ports from the WebVM to your local machine
                </p>
              </div>
              <Switch
                checked={portForwardingConfig.enabled}
                onCheckedChange={(enabled) => setPortForwardingConfig(prev => ({ ...prev, enabled }))}
              />
            </div>

            {portForwardingConfig.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Local port"
                    value={newPort.local}
                    onChange={(e) => setNewPort(prev => ({ ...prev, local: e.target.value }))}
                  />
                  <Input
                    placeholder="Remote port"
                    value={newPort.remote}
                    onChange={(e) => setNewPort(prev => ({ ...prev, remote: e.target.value }))}
                  />
                  <Button onClick={addPortMapping} variant="outline">Add</Button>
                </div>

                <div className="space-y-2">
                  {portForwardingConfig.ports.map((port, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{port.local} → {port.remote} ({port.protocol})</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePortMapping(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
