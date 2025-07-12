'use client';

import { useEffect, useState } from 'react';

export function CheerpXDirectLoader() {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    const loadCheerpX = async () => {
      try {
        console.log('🚀 Starting direct CheerpX loading...');
        
        // Check if already loaded
        if ((window as any).CheerpX) {
          console.log('✅ CheerpX already available');
          setStatus('loaded');
          return;
        }

        // Check environment
        console.log('🔍 Environment check:');
        console.log('- SharedArrayBuffer:', typeof SharedArrayBuffer !== 'undefined');
        console.log('- crossOriginIsolated:', (window as any).crossOriginIsolated);
        console.log('- Location:', window.location.href);

        if (typeof SharedArrayBuffer === 'undefined') {
          throw new Error('SharedArrayBuffer not available - cross-origin isolation required');
        }

        // Load script directly
        const script = document.createElement('script');
        script.src = 'https://cxrtnc.leaningtech.com/1.1.5/cx.js';
        script.async = true;
        script.crossOrigin = 'anonymous';

        const loadPromise = new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log('📦 CheerpX script loaded');
            
            // Wait for CheerpX to initialize
            let attempts = 0;
            const checkInterval = setInterval(() => {
              attempts++;
              console.log(`🔍 Checking for CheerpX object (attempt ${attempts})`);
              
              if ((window as any).CheerpX) {
                clearInterval(checkInterval);
                console.log('✅ CheerpX object found:', (window as any).CheerpX);
                console.log('🔧 CheerpX methods:', Object.keys((window as any).CheerpX));
                (window as any).__CHEERPX_READY__ = true;
                resolve();
              } else if (attempts > 50) { // 5 seconds
                clearInterval(checkInterval);
                reject(new Error('CheerpX object not found after script load'));
              }
            }, 100);
          };

          script.onerror = (error) => {
            console.error('❌ Script loading failed:', error);
            reject(new Error('Failed to load CheerpX script'));
          };
        });

        document.head.appendChild(script);
        await loadPromise;
        
        setStatus('loaded');
        console.log('🎉 CheerpX loading complete!');

      } catch (error) {
        console.error('💥 CheerpX loading failed:', error);
        setStatus('error');
        
        // Try fallback
        console.log('🔄 Trying fallback version...');
        try {
          const fallbackScript = document.createElement('script');
          fallbackScript.src = 'https://cxrtnc.leaningtech.com/1.0.7/cx.js';
          fallbackScript.async = true;
          
          const fallbackPromise = new Promise<void>((resolve, reject) => {
            fallbackScript.onload = () => {
              setTimeout(() => {
                if ((window as any).CheerpX) {
                  console.log('✅ Fallback CheerpX loaded');
                  (window as any).__CHEERPX_READY__ = true;
                  setStatus('loaded');
                  resolve();
                } else {
                  reject(new Error('Fallback also failed'));
                }
              }, 1000);
            };
            fallbackScript.onerror = reject;
          });

          document.head.appendChild(fallbackScript);
          await fallbackPromise;
        } catch (fallbackError) {
          console.error('💥 Fallback also failed:', fallbackError);
        }
      }
    };

    loadCheerpX();
  }, []);

  // Don't render anything, this is just a loader
  return null;
}

// Export a hook to check CheerpX status
export function useCheerpXStatus() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const ready = !!(window as any).CheerpX && !!(window as any).__CHEERPX_READY__;
      setIsReady(ready);
    };

    // Check immediately
    checkStatus();

    // Check periodically
    const interval = setInterval(checkStatus, 500);

    return () => clearInterval(interval);
  }, []);

  return isReady;
}
