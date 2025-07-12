/**
 * Workspace Search API Route
 * Advanced search capabilities for workspace files and content
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceFileIndexer } from '@/lib/workspace/services/file-indexer';
import { SearchQuery, SearchType } from '@/lib/workspace/types';
import { requireAuth, createInfrastructureAuditLog } from '@/lib/auth/infrastructure-auth';
import { InfrastructureAuthError } from '@/lib/auth/infrastructure-auth';

interface RouteParams {
  params: {
    workspaceId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await requireAuth();
    const { workspaceId } = params;

    // Parse request body
    const body = await request.json();
    const {
      query,
      type = 'content',
      filters = {},
      options = {},
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Validate search type
    const validTypes: SearchType[] = ['content', 'filename', 'symbol', 'reference', 'semantic'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid search type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize file indexer
    const fileIndexer = new WorkspaceFileIndexer(workspaceId);

    // Build search query
    const searchQuery: SearchQuery = {
      query,
      type,
      filters: {
        fileTypes: filters.fileTypes || [],
        languages: filters.languages || [],
        paths: filters.paths || [],
        excludePaths: filters.excludePaths || [],
        modifiedAfter: filters.modifiedAfter ? new Date(filters.modifiedAfter) : undefined,
        modifiedBefore: filters.modifiedBefore ? new Date(filters.modifiedBefore) : undefined,
        sizeMin: filters.sizeMin,
        sizeMax: filters.sizeMax,
        tags: filters.tags || [],
      },
      options: {
        caseSensitive: options.caseSensitive || false,
        wholeWord: options.wholeWord || false,
        regex: options.regex || false,
        fuzzy: options.fuzzy || false,
        maxResults: Math.min(options.maxResults || 50, 200), // Cap at 200 results
        includeContent: options.includeContent || false,
        highlightMatches: options.highlightMatches || true,
      },
    };

    let results;
    const startTime = Date.now();

    switch (type) {
      case 'content':
      case 'filename':
      case 'semantic':
        results = await fileIndexer.searchContent(searchQuery);
        break;

      case 'symbol':
        const symbolResults = await fileIndexer.searchSymbols(query, filters.symbolType);
        results = symbolResults.map(symbol => ({
          file: {
            id: '',
            workspaceId,
            path: symbol.location.file,
            name: symbol.location.file.split('/').pop() || '',
            type: 'text' as const,
            size: 0,
            mimeType: 'text/plain',
            encoding: 'utf-8',
            hash: '',
            isDirectory: false,
            permissions: {} as any,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            lastAccessedAt: new Date(),
            version: 1,
          },
          matches: [{
            line: symbol.location.line,
            column: symbol.location.column,
            length: symbol.name.length,
            text: symbol.name,
            context: { before: '', after: '' },
          }],
          score: 1,
          context: {
            symbols: [symbol],
            imports: [],
            exports: [],
            relatedFiles: [],
          },
        }));
        break;

      case 'reference':
        const referenceResults = await fileIndexer.findReferences(query, filters.filePath);
        results = referenceResults.map(ref => ({
          file: {
            id: '',
            workspaceId,
            path: ref.location.file,
            name: ref.location.file.split('/').pop() || '',
            type: 'text' as const,
            size: 0,
            mimeType: 'text/plain',
            encoding: 'utf-8',
            hash: '',
            isDirectory: false,
            permissions: {} as any,
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            lastAccessedAt: new Date(),
            version: 1,
          },
          matches: [{
            line: ref.location.line,
            column: ref.location.column,
            length: ref.name.length,
            text: ref.name,
            context: { before: '', after: '' },
          }],
          score: 1,
          context: {
            symbols: [ref],
            imports: [],
            exports: [],
            relatedFiles: [],
          },
        }));
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported search type' },
          { status: 400 }
        );
    }

    const searchTime = Date.now() - startTime;

    // Log search
    await createInfrastructureAuditLog(
      'workspace.search',
      'workspace',
      workspaceId,
      { 
        query,
        type,
        resultCount: results.length,
        searchTime,
        filters: Object.keys(filters),
      },
      request
    );

    return NextResponse.json({
      success: true,
      query: searchQuery,
      results,
      count: results.length,
      searchTime,
      metadata: {
        workspaceId,
        timestamp: new Date().toISOString(),
        searchType: type,
      },
    });

  } catch (error) {
    console.error('Failed to search workspace:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// Get search suggestions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await requireAuth();
    const { workspaceId } = params;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'content';

    if (!query) {
      return NextResponse.json({
        success: true,
        suggestions: [],
      });
    }

    // Initialize file indexer
    const fileIndexer = new WorkspaceFileIndexer(workspaceId);

    let suggestions: string[] = [];

    switch (type) {
      case 'symbol':
        // Get symbol suggestions
        const symbols = await fileIndexer.searchSymbols(query);
        suggestions = symbols
          .map(symbol => symbol.name)
          .filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates
          .slice(0, 10);
        break;

      case 'filename':
        // This would require a separate method to get filename suggestions
        // For now, return empty suggestions
        suggestions = [];
        break;

      default:
        // For content search, we could implement autocomplete based on indexed tokens
        suggestions = [];
    }

    return NextResponse.json({
      success: true,
      query,
      type,
      suggestions,
    });

  } catch (error) {
    console.error('Failed to get search suggestions:', error);

    if (error instanceof InfrastructureAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === 'INSUFFICIENT_PERMISSIONS' ? 403 : 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
