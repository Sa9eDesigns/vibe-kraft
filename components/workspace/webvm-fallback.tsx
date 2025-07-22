'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Shield, 
  Globe,
  Terminal,
  Code,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebVMFallbackProps {
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export function WebVMFallback({ error, onRetry, className }: WebVMFallbackProps) {
  const isSharedArrayBufferError = error?.includes('SharedArrayBuffer');
  const isCrossOriginError = error?.includes('cross-origin');
  
  const environmentChecks = [
    {
      name: 'HTTPS/Localhost',
      status: typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost'),
      description: 'Secure context required for SharedArrayBuffer'
    },
    {
      name: 'SharedArrayBuffer',
      status: typeof SharedArrayBuffer !== 'undefined',
      description: 'Required for WebAssembly threading'
    },
    {
      name: 'Cross-Origin Isolation',
      status: typeof window !== 'undefined' && (window as any).crossOriginIsolated,
      description: 'Required headers: COEP and COOP'
    },
    {
      name: 'WebAssembly',
      status: typeof WebAssembly !== 'undefined',
      description: 'Required for CheerpX runtime'
    }
  ];

  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      handleRefresh();
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[400px] p-6", className)}>
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-xl">WebVM Not Available</CardTitle>
          <p className="text-muted-foreground">
            The WebVM environment requires specific browser features and security headers to function properly.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2 text-sm whitespace-pre-wrap">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Environment Checks */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Environment Requirements
            </h3>
            
            <div className="grid gap-2">
              {environmentChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {check.status ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{check.name}</div>
                      <div className="text-xs text-muted-foreground">{check.description}</div>
                    </div>
                  </div>
                  <Badge variant={check.status ? "secondary" : "destructive"} className="text-xs">
                    {check.status ? 'OK' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Possible Solutions
            </h3>
            
            <div className="space-y-2 text-sm">
              {isSharedArrayBufferError && (
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertTitle>Cross-Origin Isolation Required</AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="space-y-2">
                      <p>The server needs to send these HTTP headers:</p>
                      <div className="bg-muted p-2 rounded font-mono text-xs">
                        Cross-Origin-Embedder-Policy: require-corp<br/>
                        Cross-Origin-Opener-Policy: same-origin
                      </div>
                      <p className="text-xs text-muted-foreground">
                        These headers are configured in next.config.ts for WebVM routes.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-2">
                <div className="p-3 border rounded-lg">
                  <div className="font-medium text-sm mb-1">🔄 Refresh the page</div>
                  <div className="text-xs text-muted-foreground">
                    Sometimes the headers need a fresh page load to take effect.
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium text-sm mb-1">🌐 Check your URL</div>
                  <div className="text-xs text-muted-foreground">
                    Make sure you're accessing via HTTPS or localhost. Current: {typeof window !== 'undefined' ? window.location.protocol : 'unknown'}
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium text-sm mb-1">🔧 Development Server</div>
                  <div className="text-xs text-muted-foreground">
                    Try restarting your development server with: <code className="bg-muted px-1 rounded">pnpm dev</code>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="font-medium text-sm mb-1">🌍 Browser Support</div>
                  <div className="text-xs text-muted-foreground">
                    Ensure you're using a modern browser that supports SharedArrayBuffer and WebAssembly.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alternative Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Alternative Options
            </h3>
            
            <div className="grid gap-2">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-3"
                onClick={() => window.open('/ai-workspace', '_blank')}
              >
                <Code className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium text-sm">Try AI Workspace</div>
                  <div className="text-xs text-muted-foreground">
                    Use the AI-powered development environment without WebVM
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-3"
                onClick={() => window.open('/dashboard', '_blank')}
              >
                <Globe className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium text-sm">Go to Dashboard</div>
                  <div className="text-xs text-muted-foreground">
                    Manage your projects and infrastructure
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleRetry} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            
            <Button variant="outline" onClick={handleRefresh}>
              <Globe className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open('https://docs.leaningtech.com/cheerpx/getting-started', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Docs
            </Button>
          </div>

          {/* Debug Info */}
          {typeof window !== 'undefined' && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Debug Information
              </summary>
              <div className="mt-2 p-3 bg-muted rounded font-mono text-xs space-y-1">
                <div>URL: {window.location.href}</div>
                <div>Protocol: {window.location.protocol}</div>
                <div>Host: {window.location.host}</div>
                <div>User Agent: {navigator.userAgent}</div>
                <div>SharedArrayBuffer: {typeof SharedArrayBuffer !== 'undefined' ? 'Available' : 'Not Available'}</div>
                <div>CrossOriginIsolated: {(window as any).crossOriginIsolated ? 'Yes' : 'No'}</div>
                <div>WebAssembly: {typeof WebAssembly !== 'undefined' ? 'Available' : 'Not Available'}</div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
