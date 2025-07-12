'use client';

import Script from "next/script";
import { useEffect, useState } from "react";

export function CheerpXScriptLoader() {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    // Check if CheerpX is already loaded
    if (typeof window !== 'undefined' && (window as any).CheerpX) {
      console.log('✅ CheerpX already available');
      setScriptLoaded(true);
      return;
    }

    // Manual script loading as fallback
    const loadCheerpXManually = () => {
      console.log('🔄 Loading CheerpX manually...');
      const script = document.createElement('script');
      script.src = 'https://cxrtnc.leaningtech.com/1.1.5/cx.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Manual CheerpX script loaded');
        setTimeout(() => {
          if ((window as any).CheerpX) {
            console.log('✅ CheerpX object is now available');
            setScriptLoaded(true);
            (window as any).__CHEERPX_READY__ = true;
          } else {
            console.warn('⚠️ Script loaded but CheerpX object still not found');
          }
        }, 1000);
      };
      script.onerror = () => {
        console.error('❌ Manual script loading failed');
        setScriptError(true);
      };
      document.head.appendChild(script);
    };

    // Try manual loading after a short delay if Next.js Script doesn't work
    const timeout = setTimeout(loadCheerpXManually, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const handleScriptLoad = () => {
    console.log('✅ CheerpX script loaded successfully');
    setScriptLoaded(true);
    setScriptError(false);

    // Wait a bit for CheerpX to initialize
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).CheerpX) {
        console.log('✅ CheerpX is available:', (window as any).CheerpX);
        console.log('CheerpX methods:', Object.keys((window as any).CheerpX));
        // Set a global flag to indicate CheerpX is ready
        (window as any).__CHEERPX_READY__ = true;
      } else {
        console.warn('⚠️ CheerpX script loaded but CheerpX object not found');
        console.log('Available window properties:', Object.keys(window).filter(k =>
          k.toLowerCase().includes('cheerp') || k.toLowerCase().includes('cx')
        ));
      }
    }, 500); // Give CheerpX more time to initialize
  };

  const handleScriptError = (e: any) => {
    console.error('❌ Failed to load CheerpX script from primary URL:', e);
    setScriptError(true);

    // Try fallback URL manually
    console.log('🔄 Trying fallback CheerpX loading...');
    const fallbackScript = document.createElement('script');
    fallbackScript.src = 'https://cxrtnc.leaningtech.com/1.0.7/cx.js';
    fallbackScript.async = true;
    fallbackScript.onload = () => {
      console.log('✅ CheerpX loaded from fallback URL (1.0.7)');
      handleScriptLoad(); // Use the same handler
    };
    fallbackScript.onerror = () => {
      console.error('❌ Failed to load CheerpX from fallback URL');
      // Try one more fallback
      const lastResortScript = document.createElement('script');
      lastResortScript.src = 'https://cxrtnc.leaningtech.com/cx.js';
      lastResortScript.async = true;
      lastResortScript.onload = () => {
        console.log('✅ CheerpX loaded from last resort URL');
        handleScriptLoad();
      };
      lastResortScript.onerror = () => {
        console.error('❌ All CheerpX script sources failed');
        setScriptError(true);
      };
      document.head.appendChild(lastResortScript);
    };
    document.head.appendChild(fallbackScript);
  };

  return (
    <>
      {/* Load CheerpX script - using latest version */}
      <Script
        src="https://cxrtnc.leaningtech.com/1.1.5/cx.js"
        strategy="beforeInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />

      {/* Fallback script if primary fails */}
      {scriptError && !scriptLoaded && (
        <Script
          src="https://cxrtnc.leaningtech.com/1.0.7/cx.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('CheerpX loaded from fallback URL (1.0.7)');
            setScriptLoaded(true);
            setScriptError(false);
          }}
          onError={() => {
            console.error('All CheerpX script sources failed');
          }}
        />
      )}
      
      {/* Set required headers for cross-origin isolation */}
      <Script id="cheerpx-headers" strategy="beforeInteractive">
        {`
          // Check cross-origin isolation requirements
          console.log('=== CheerpX Environment Check ===');
          console.log('SharedArrayBuffer available:', typeof SharedArrayBuffer !== 'undefined');
          console.log('crossOriginIsolated:', window.crossOriginIsolated);
          console.log('Location:', window.location.href);
          console.log('User Agent:', navigator.userAgent);

          if (typeof SharedArrayBuffer === 'undefined') {
            console.error('❌ SharedArrayBuffer is not available. Cross-origin isolation is required for CheerpX.');
            console.error('Make sure the following headers are set:');
            console.error('Cross-Origin-Embedder-Policy: require-corp');
            console.error('Cross-Origin-Opener-Policy: same-origin');
          } else {
            console.log('✅ SharedArrayBuffer is available - cross-origin isolation is working');
          }

          // Global flag to indicate CheerpX script loading status
          window.__CHEERPX_LOADING__ = true;
          console.log('=== End Environment Check ===');
        `}
      </Script>
    </>
  );
}
