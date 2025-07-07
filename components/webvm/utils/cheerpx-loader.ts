// CheerpX Loader Utility
// Handles loading and initialization of CheerpX WebVM

export interface CheerpXConfig {
  version?: string;
  licenseKey?: string;
  baseUrl?: string;
  enableSharedArrayBuffer?: boolean;
  enableCrossOriginIsolation?: boolean;
}

export interface LoaderStatus {
  loaded: boolean;
  loading: boolean;
  error?: string;
  version?: string;
}

class CheerpXLoader {
  private static instance: CheerpXLoader;
  private status: LoaderStatus = { loaded: false, loading: false };
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): CheerpXLoader {
    if (!CheerpXLoader.instance) {
      CheerpXLoader.instance = new CheerpXLoader();
    }
    return CheerpXLoader.instance;
  }

  async load(config: CheerpXConfig = {}): Promise<void> {
    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Return immediately if already loaded
    if (this.status.loaded) {
      return Promise.resolve();
    }

    this.loadPromise = this.performLoad(config);
    return this.loadPromise;
  }

  private async performLoad(config: CheerpXConfig): Promise<void> {
    this.status.loading = true;
    this.status.error = undefined;

    try {
      // Check browser compatibility
      await this.checkBrowserCompatibility();

      // Setup cross-origin isolation if needed
      if (config.enableCrossOriginIsolation) {
        this.setupCrossOriginIsolation();
      }

      // Load CheerpX script
      await this.loadCheerpXScript(config);

      // Verify CheerpX is available
      if (!window.CheerpX) {
        throw new Error('CheerpX failed to load properly');
      }

      this.status.loaded = true;
      this.status.loading = false;
      this.status.version = config.version || 'latest';

      console.log('CheerpX loaded successfully');
    } catch (error) {
      this.status.loading = false;
      this.status.error = error instanceof Error ? error.message : String(error);
      this.loadPromise = null; // Allow retry
      throw error;
    }
  }

  private async checkBrowserCompatibility(): Promise<void> {
    const checks = [
      {
        name: 'WebAssembly',
        test: () => typeof WebAssembly !== 'undefined',
        message: 'WebAssembly is required for CheerpX'
      },
      {
        name: 'SharedArrayBuffer',
        test: () => typeof SharedArrayBuffer !== 'undefined',
        message: 'SharedArrayBuffer is required. Enable cross-origin isolation.'
      },
      {
        name: 'Worker',
        test: () => typeof Worker !== 'undefined',
        message: 'Web Workers are required for CheerpX'
      },
      {
        name: 'IndexedDB',
        test: () => typeof indexedDB !== 'undefined',
        message: 'IndexedDB is required for persistent storage'
      }
    ];

    const failures = checks.filter(check => !check.test());
    
    if (failures.length > 0) {
      const messages = failures.map(f => f.message).join(', ');
      throw new Error(`Browser compatibility check failed: ${messages}`);
    }
  }

  private setupCrossOriginIsolation(): void {
    // Check if cross-origin isolation is already enabled
    if (crossOriginIsolated) {
      return;
    }

    // Log warning about cross-origin isolation
    console.warn(
      'Cross-origin isolation is not enabled. ' +
      'Add these headers to your server response:\n' +
      'Cross-Origin-Embedder-Policy: require-corp\n' +
      'Cross-Origin-Opener-Policy: same-origin'
    );
  }

  private async loadCheerpXScript(config: CheerpXConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (document.querySelector('script[src*="cheerpx"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      const version = config.version || 'latest';
      const baseUrl = config.baseUrl || 'https://cxrtnc.leaningtech.com';
      
      script.src = `${baseUrl}/1.0.0/cx.js`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('CheerpX script loaded');
        resolve();
      };

      script.onerror = (error) => {
        console.error('Failed to load CheerpX script:', error);
        reject(new Error('Failed to load CheerpX script'));
      };

      // Add license key if provided
      if (config.licenseKey) {
        script.setAttribute('data-cx-license', config.licenseKey);
      }

      document.head.appendChild(script);
    });
  }

  getStatus(): LoaderStatus {
    return { ...this.status };
  }

  isLoaded(): boolean {
    return this.status.loaded;
  }

  isLoading(): boolean {
    return this.status.loading;
  }

  getError(): string | undefined {
    return this.status.error;
  }

  // Utility method to wait for CheerpX to be ready
  async waitForReady(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (!this.status.loaded) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for CheerpX to load');
      }
      
      if (this.status.error) {
        throw new Error(`CheerpX failed to load: ${this.status.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Reset loader state (useful for testing)
  reset(): void {
    this.status = { loaded: false, loading: false };
    this.loadPromise = null;
  }
}

// Export singleton instance
export const cheerpxLoader = CheerpXLoader.getInstance();

// Utility functions
export async function ensureCheerpXLoaded(config?: CheerpXConfig): Promise<void> {
  await cheerpxLoader.load(config);
}

export function isCheerpXLoaded(): boolean {
  return cheerpxLoader.isLoaded();
}

export function getCheerpXStatus(): LoaderStatus {
  return cheerpxLoader.getStatus();
}

// Browser compatibility check utility
export function checkCheerpXCompatibility(): { compatible: boolean; issues: string[] } {
  const issues: string[] = [];

  if (typeof WebAssembly === 'undefined') {
    issues.push('WebAssembly not supported');
  }

  if (typeof SharedArrayBuffer === 'undefined') {
    issues.push('SharedArrayBuffer not available (cross-origin isolation required)');
  }

  if (typeof Worker === 'undefined') {
    issues.push('Web Workers not supported');
  }

  if (typeof indexedDB === 'undefined') {
    issues.push('IndexedDB not supported');
  }

  // Check for secure context (HTTPS)
  if (!window.isSecureContext) {
    issues.push('Secure context (HTTPS) required');
  }

  return {
    compatible: issues.length === 0,
    issues
  };
}

// Development helper to setup cross-origin isolation headers
export function getRequiredHeaders(): Record<string, string> {
  return {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin'
  };
}

// Type declarations for CheerpX global
declare global {
  interface Window {
    CheerpX: any;
  }
}
