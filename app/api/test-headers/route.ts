import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get all headers from the request
  const headers: Record<string, string> = {};
  
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Check for cross-origin isolation headers
  const responseHeaders = new Headers();
  
  // Add CORS headers for testing
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return NextResponse.json(
    {
      message: 'Headers test endpoint',
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
      headers,
      crossOriginIsolation: {
        note: 'Cross-origin isolation headers are set in next.config.ts for specific routes',
        requiredHeaders: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin'
        },
        appliedTo: [
          '/(workspace|ai-workspace)/:path*',
          '/cheerpx/:path*'
        ]
      }
    },
    { 
      status: 200,
      headers: responseHeaders
    }
  );
}
