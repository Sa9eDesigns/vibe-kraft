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

// Debug helper to inspect what's available after script load
function debugCheerpXAvailability(): void {
  console.log('=== CheerpX Debug Info ===');
  console.log('window.CheerpX:', typeof window.CheerpX, window.CheerpX);
  console.log('window.CX:', typeof (window as any).CX, (window as any).CX);
  console.log('window.cheerpx:', typeof (window as any).cheerpx, (window as any).cheerpx);

  // Check for any properties that might be CheerpX-related
  const cheerpxProps = Object.keys(window).filter(key =>
    key.toLowerCase().includes('cheerp') ||
    key.toLowerCase().includes('cx') ||
    key.toLowerCase().includes('wasm') ||
    key.toLowerCase().includes('linux')
  );
  console.log('Potential CheerpX-related properties:', cheerpxProps);

  // Check if there are any global functions that might be CheerpX
  const globalFunctions = Object.keys(window).filter(key => typeof (window as any)[key] === 'function');
  console.log('Global functions (first 10):', globalFunctions.slice(0, 10));

  console.log('=== End Debug Info ===');
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
    // Based on research: CheerpX 1.0.7 is the latest stable version
    // CheerpX supports both regular script and ES6 module loading
    const attempts = [
      // Try NPM package first (if available) - now using latest version 1.1.5
      { version: '1.1.5', baseUrl: '', method: 'npm' },
      // Try latest stable version from CDN
      { version: '1.1.5', baseUrl: 'https://cxrtnc.leaningtech.com', method: 'script' },
      { version: '1.1.5', baseUrl: 'https://cxrtnc.leaningtech.com', method: 'esm' },
      // Fallback to older stable versions
      { version: '1.0.7', baseUrl: 'https://cxrtnc.leaningtech.com', method: 'script' },
      { version: '1.0.7', baseUrl: 'https://cxrtnc.leaningtech.com', method: 'esm' },
      // Fallback to user-specified version or even older versions
      { version: config.version || '1.0.0', baseUrl: 'https://cxrtnc.leaningtech.com', method: 'script' },
      { version: config.version || '1.0.0', baseUrl: 'https://cxrtnc.leaningtech.com', method: 'esm' },
    ];

    for (const attempt of attempts) {
      try {
        console.log(`Attempting to load CheerpX version ${attempt.version} from ${attempt.baseUrl} using ${attempt.method} method`);

        if (attempt.method === 'npm') {
          await this.tryLoadFromNPM(attempt.version);
        } else if (attempt.method === 'esm') {
          await this.tryLoadAsESModule(attempt.version, { ...config, baseUrl: attempt.baseUrl });
        } else {
          await this.tryLoadVersion(attempt.version, { ...config, baseUrl: attempt.baseUrl });
        }

        console.log(`Successfully loaded CheerpX version ${attempt.version}`);
        return; // Success, exit
      } catch (error) {
        console.warn(`Failed to load CheerpX version ${attempt.version} with ${attempt.method}:`, error);
        if (attempt === attempts[attempts.length - 1]) {
          throw new Error(`Failed to load CheerpX after trying all methods: ${error}`);
        }
      }
    }
  }

  private async tryLoadAsESModule(version: string, config: CheerpXConfig): Promise<void> {
    const baseUrl = config.baseUrl || 'https://cxrtnc.leaningtech.com';

    // CheerpX provides cx.esm.js for ES6 module loading
    const esmUrl = `${baseUrl}/${version}/cx.esm.js`;

    try {
      console.log('Loading CheerpX as ES module from:', esmUrl);

      // Use script element instead of dynamic import to avoid Next.js issues
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = esmUrl;
        script.async = true;

        script.onload = () => {
          console.log('CheerpX ES module script loaded from:', esmUrl);
          debugCheerpXAvailability();

          // Check if CheerpX is now available globally
          if (window.CheerpX) {
            console.log('CheerpX ES module successfully loaded and available globally');
            resolve();
          } else {
            reject(new Error('CheerpX ES module loaded but CheerpX object not found'));
          }
        };

        script.onerror = (error) => {
          reject(new Error(`Failed to load CheerpX ES module: ${error}`));
        };

        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Failed to load CheerpX ES module:', error);

      // Fallback: Try loading the ESM file as a regular script
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = esmUrl;
        script.async = true;

        script.onload = () => {
          console.log('CheerpX ESM script loaded from:', esmUrl);
          debugCheerpXAvailability();

          // Give time for module initialization
          setTimeout(() => {
            const cheerpx = window.CheerpX || (window as any).CX || (window as any).cheerpx;
            if (cheerpx) {
              if (!window.CheerpX) window.CheerpX = cheerpx;
              resolve();
            } else {
              reject(new Error('CheerpX ESM script loaded but no API found'));
            }
          }, 300);
        };

        script.onerror = (scriptError) => {
          reject(new Error(`Failed to load CheerpX ESM script: ${scriptError}`));
        };

        document.head.appendChild(script);
      });
    }
  }

  private async tryLoadFromNPM(version: string): Promise<void> {
    try {
      console.log(`Attempting to load CheerpX from NPM package @leaningtech/cheerpx@${version}`);

      // For now, skip NPM loading to avoid build issues
      // We'll use CDN loading instead
      throw new Error('NPM loading disabled for build compatibility');
    } catch (error) {
      // NPM package not available or failed to load
      console.warn('CheerpX NPM package not available:', error);
      throw new Error(`Failed to load CheerpX from NPM: ${error}`);
    }
  }

  private async tryLoadVersion(version: string, config: CheerpXConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded or CheerpX is available
      const existingScript = document.querySelector('script[src*="cx.js"]');
      const cheerpxAvailable = window.CheerpX || (window as any).CX || (window as any).cheerpx;

      if (existingScript && cheerpxAvailable) {
        console.log('CheerpX already available:', typeof cheerpxAvailable);
        resolve();
        return;
      }

      if (existingScript && !cheerpxAvailable) {
        console.log('CheerpX script exists but object not available, waiting...');
        // Script exists but object not ready, wait for it
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          const cx = window.CheerpX || (window as any).CX || (window as any).cheerpx;
          if (cx) {
            clearInterval(checkInterval);
            if (!window.CheerpX) window.CheerpX = cx;
            resolve();
          } else if (attempts >= 20) {
            clearInterval(checkInterval);
            reject(new Error('CheerpX script exists but object never became available'));
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      const baseUrl = config.baseUrl || 'https://cxrtnc.leaningtech.com';

      script.src = `${baseUrl}/${version}/cx.js`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('CheerpX script loaded from:', script.src);

        // Debug: Check what's available on window
        debugCheerpXAvailability();

        // Try multiple detection methods
        const detectCheerpX = () => {
          // Method 1: Direct CheerpX object
          if (window.CheerpX) {
            console.log('CheerpX found via window.CheerpX:', typeof window.CheerpX);
            return window.CheerpX;
          }

          // Method 2: Check for CX object (alternative naming)
          if ((window as any).CX) {
            console.log('CheerpX found via window.CX:', typeof (window as any).CX);
            return (window as any).CX;
          }

          // Method 3: Check for cheerpx (lowercase)
          if ((window as any).cheerpx) {
            console.log('CheerpX found via window.cheerpx:', typeof (window as any).cheerpx);
            return (window as any).cheerpx;
          }

          return null;
        };

        // Give time for the script to initialize and try multiple times
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = setInterval(() => {
          attempts++;
          const cheerpx = detectCheerpX();

          if (cheerpx) {
            clearInterval(checkInterval);
            console.log('CheerpX detected successfully after', attempts, 'attempts');
            // Store reference for consistent access
            if (!window.CheerpX) {
              window.CheerpX = cheerpx;
            }
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('CheerpX not found after', maxAttempts, 'attempts');
            console.log('Available window properties:', Object.keys(window).slice(0, 20));
            reject(new Error('CheerpX script loaded but CheerpX object not available after multiple attempts'));
          }
        }, 100);
      };

      script.onerror = (error) => {
        console.error('Failed to load CheerpX script from:', script.src, error);
        reject(new Error(`Failed to load CheerpX script from ${script.src}`));
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
