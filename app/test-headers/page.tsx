'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function TestHeadersPage() {
  const [checks, setChecks] = useState({
    sharedArrayBuffer: false,
    crossOriginIsolated: false,
    webAssembly: false,
    secureContext: false
  });

  const [headers, setHeaders] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check browser features
    setChecks({
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      crossOriginIsolated: (window as any).crossOriginIsolated || false,
      webAssembly: typeof WebAssembly !== 'undefined',
      secureContext: window.isSecureContext || false
    });

    // Try to fetch headers information
    fetch('/api/test-headers')
      .then(res => res.json())
      .then(data => setHeaders(data.headers || {}))
      .catch(err => console.error('Failed to fetch headers:', err));
  }, []);

  const allChecksPass = Object.values(checks).every(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Cross-Origin Isolation Test</h1>
          <p className="text-muted-foreground">
            This page tests if the required headers for WebVM are properly configured.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {allChecksPass ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              Browser Feature Checks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(checks).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {value ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <Badge variant={value ? "secondary" : "destructive"}>
                  {value ? 'Available' : 'Not Available'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono">
            <div>
              <strong>URL:</strong> {window.location.href}
            </div>
            <div>
              <strong>Protocol:</strong> {window.location.protocol}
            </div>
            <div>
              <strong>Host:</strong> {window.location.host}
            </div>
            <div>
              <strong>User Agent:</strong> {navigator.userAgent}
            </div>
          </CardContent>
        </Card>

        {Object.keys(headers).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Response Headers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono">
              {Object.entries(headers).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {value}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Required Headers for WebVM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="mb-2">For WebVM to work, these headers must be present:</p>
              <div className="bg-muted p-3 rounded font-mono text-xs space-y-1">
                <div>Cross-Origin-Embedder-Policy: require-corp</div>
                <div>Cross-Origin-Opener-Policy: same-origin</div>
              </div>
            </div>
            
            <div className="text-sm">
              <p className="mb-2">These headers are configured in next.config.ts for:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>/workspace/* routes</li>
                <li>/ai-workspace/* routes</li>
                <li>/cheerpx/* static assets</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()} className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Test
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.open('/workspace', '_blank')}
            disabled={!allChecksPass}
          >
            Test WebVM
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.open('/ai-workspace', '_blank')}
          >
            Test AI Workspace
          </Button>
        </div>

        {!allChecksPass && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                    Some checks failed
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    WebVM requires all checks to pass. Try:
                  </p>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 list-disc list-inside space-y-1">
                    <li>Refreshing the page</li>
                    <li>Restarting the development server</li>
                    <li>Accessing via HTTPS or localhost</li>
                    <li>Using a modern browser (Chrome, Firefox, Safari)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
