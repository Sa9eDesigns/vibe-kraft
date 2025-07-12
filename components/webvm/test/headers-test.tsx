'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  value?: string;
  description: string;
}

export function HeadersTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoadingCheerpX, setIsLoadingCheerpX] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results: TestResult[] = [];

    // Test 1: SharedArrayBuffer availability
    results.push({
      name: 'SharedArrayBuffer',
      passed: typeof SharedArrayBuffer !== 'undefined',
      value: typeof SharedArrayBuffer !== 'undefined' ? 'Available' : 'Not Available',
      description: 'Required for WebAssembly threading and CheerpX performance'
    });

    // Test 2: WebAssembly support
    results.push({
      name: 'WebAssembly',
      passed: typeof WebAssembly !== 'undefined',
      value: typeof WebAssembly !== 'undefined' ? 'Supported' : 'Not Supported',
      description: 'Required for running CheerpX WebVM'
    });

    // Test 3: Cross-origin isolation
    results.push({
      name: 'Cross-Origin Isolation',
      passed: window.crossOriginIsolated === true,
      value: window.crossOriginIsolated ? 'Enabled' : 'Disabled',
      description: 'Required for SharedArrayBuffer to be available'
    });

    // Test 4: Secure context (HTTPS)
    results.push({
      name: 'Secure Context',
      passed: window.isSecureContext === true,
      value: window.isSecureContext ? 'HTTPS' : 'HTTP',
      description: 'HTTPS is required for security features'
    });

    // Test 5: Web Workers
    results.push({
      name: 'Web Workers',
      passed: typeof Worker !== 'undefined',
      value: typeof Worker !== 'undefined' ? 'Supported' : 'Not Supported',
      description: 'Required for background processing'
    });

    // Test 6: IndexedDB
    results.push({
      name: 'IndexedDB',
      passed: typeof indexedDB !== 'undefined',
      value: typeof indexedDB !== 'undefined' ? 'Available' : 'Not Available',
      description: 'Required for persistent storage'
    });

    // Test 7: CheerpX Availability
    results.push({
      name: 'CheerpX',
      passed: typeof (window as any).CheerpX !== 'undefined',
      value: typeof (window as any).CheerpX !== 'undefined' ? 'Loaded' : 'Not Loaded',
      description: 'CheerpX WebAssembly runtime for WebVM'
    });

    // Test 8: Fetch API test for headers
    try {
      const response = await fetch('/api/webvm/test-headers');
      const data = await response.json();

      results.push({
        name: 'Server Headers',
        passed: response.ok,
        value: response.ok ? 'Configured' : 'Error',
        description: 'Server-side cross-origin isolation headers'
      });
    } catch (error) {
      results.push({
        name: 'Server Headers',
        passed: false,
        value: 'Error',
        description: 'Failed to test server headers'
      });
    }

    setTestResults(results);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const loadCheerpX = async () => {
    setIsLoadingCheerpX(true);
    try {
      console.log('Starting CheerpX loading process...');
      const { ensureCheerpXLoaded } = await import('../../webvm/utils/cheerpx-loader');

      console.log('Attempting to load CheerpX...');
      await ensureCheerpXLoaded({
        enableCrossOriginIsolation: true,
        enableSharedArrayBuffer: true
      });

      console.log('CheerpX loaded successfully');
      // Re-run tests after loading CheerpX
      await runTests();
    } catch (error) {
      console.error('Failed to load CheerpX:', error);
      // Still run tests to see the updated status
      await runTests();
    } finally {
      setIsLoadingCheerpX(false);
    }
  };

  const debugCheerpX = async () => {
    console.log('=== Manual CheerpX Debug ===');
    console.log('window.CheerpX:', typeof (window as any).CheerpX, (window as any).CheerpX);
    console.log('window.CX:', typeof (window as any).CX, (window as any).CX);
    console.log('window.cheerpx:', typeof (window as any).cheerpx, (window as any).cheerpx);

    // Check for scripts
    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(src => src.includes('cx.js') || src.includes('cheerp'));
    console.log('CheerpX-related scripts:', scripts);

    // Check window properties
    const cheerpxProps = Object.keys(window).filter(key =>
      key.toLowerCase().includes('cheerp') ||
      key.toLowerCase().includes('cx') ||
      key.toLowerCase().includes('wasm')
    );
    console.log('Potential CheerpX properties:', cheerpxProps);
    console.log('=== End Manual Debug ===');
  };

  useEffect(() => {
    runTests();
  }, []);

  const allTestsPassed = testResults.length > 0 && testResults.every(test => test.passed);
  const criticalTestsPassed = testResults
    .filter(test => ['SharedArrayBuffer', 'WebAssembly', 'Cross-Origin Isolation', 'CheerpX'].includes(test.name))
    .every(test => test.passed);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>WebVM Compatibility Test</span>
          <div className="flex gap-2">
            <Button
              onClick={loadCheerpX}
              disabled={isLoadingCheerpX || isLoading}
              size="sm"
              variant="default"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCheerpX ? 'animate-spin' : ''}`} />
              Load CheerpX
            </Button>
            <Button
              onClick={debugCheerpX}
              size="sm"
              variant="secondary"
            >
              Debug
            </Button>
            <Button
              onClick={runTests}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardTitle>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <Alert variant={allTestsPassed ? "default" : criticalTestsPassed ? "default" : "destructive"}>
          {allTestsPassed ? (
            <CheckCircle className="h-4 w-4" />
          ) : criticalTestsPassed ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {allTestsPassed 
              ? "All tests passed! WebVM should work correctly."
              : criticalTestsPassed
              ? "Critical tests passed. WebVM should work with minor limitations."
              : "Critical tests failed. WebVM will not work properly."
            }
          </AlertDescription>
        </Alert>

        {/* Test Results */}
        <div className="space-y-3">
          {testResults.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {test.passed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-muted-foreground">{test.description}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={test.passed ? "default" : "destructive"}>
                  {test.value}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Browser Information */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Browser Information</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>User Agent: {navigator.userAgent}</div>
            <div>Platform: {navigator.platform}</div>
            <div>Language: {navigator.language}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
