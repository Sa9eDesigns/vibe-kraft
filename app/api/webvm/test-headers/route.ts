import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get the request headers
  const requestHeaders = Object.fromEntries(request.headers.entries());
  
  // Check if the client supports the required features
  const userAgent = request.headers.get('user-agent') || '';
  
  // Create response with debugging information
  const debugInfo = {
    timestamp: new Date().toISOString(),
    userAgent,
    requestHeaders: {
      'sec-fetch-site': requestHeaders['sec-fetch-site'],
      'sec-fetch-mode': requestHeaders['sec-fetch-mode'],
      'sec-fetch-dest': requestHeaders['sec-fetch-dest'],
    },
    expectedResponseHeaders: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    clientChecks: {
      note: 'These checks should be performed on the client side',
      checks: [
        'typeof SharedArrayBuffer !== "undefined"',
        'typeof WebAssembly !== "undefined"',
        'window.crossOriginIsolated === true',
        'window.isSecureContext === true'
      ]
    }
  };

  // Create response with proper headers
  const response = NextResponse.json(debugInfo);
  
  // Add the cross-origin isolation headers explicitly
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  
  return response;
}
