/**
 * Workspace File Indexer Service
 * Advanced file indexing and search capabilities for workspace files
 */

import { WorkspaceFile, FileIndex, CodeSymbol, SearchQuery, SearchResult } from '../types';
import { db } from '@/lib/db';

export class WorkspaceFileIndexer {
  private readonly workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // =============================================================================
  // INDEXING OPERATIONS
  // =============================================================================

  /**
   * Index a file for search and analysis
   */
  async indexFile(file: WorkspaceFile, content: string): Promise<FileIndex> {
    const tokens = this.tokenizeContent(content);
    const symbols = await this.extractSymbols(file.path, content, file.metadata.language);
    const imports = this.extractImports(content, file.metadata.language);
    const exports = this.extractExports(content, file.metadata.language);
    const dependencies = this.extractDependencies(content, file.metadata.language);
    const complexity = this.calculateComplexity(content, file.metadata.language);

    // Store or update index in database
    const existingIndex = await db.fileIndex.findFirst({
      where: {
        workspaceId: this.workspaceId,
        path: file.path,
      },
    });

    const indexData = {
      workspaceId: this.workspaceId,
      path: file.path,
      content,
      tokens,
      language: file.metadata.language || 'unknown',
      symbols,
      imports,
      exports,
      dependencies,
      complexity,
      lastIndexed: new Date(),
      indexVersion: '1.0',
    };

    let fileIndex;
    if (existingIndex) {
      fileIndex = await db.fileIndex.update({
        where: { id: existingIndex.id },
        data: indexData,
      });
    } else {
      fileIndex = await db.fileIndex.create({
        data: indexData,
      });
    }

    return this.mapToFileIndex(fileIndex);
  }

  /**
   * Remove file from index
   */
  async removeFromIndex(filePath: string): Promise<void> {
    await db.fileIndex.deleteMany({
      where: {
        workspaceId: this.workspaceId,
        path: filePath,
      },
    });
  }

  /**
   * Reindex all files in workspace
   */
  async reindexWorkspace(): Promise<void> {
    const files = await db.workspaceFile.findMany({
      where: {
        workspaceId: this.workspaceId,
        isDirectory: false,
        type: 'text',
      },
    });

    for (const file of files) {
      try {
        // Get file content (this would need to be implemented)
        const content = await this.getFileContent(file.path);
        if (content) {
          await this.indexFile(this.mapToWorkspaceFile(file), content);
        }
      } catch (error) {
        console.error(`Failed to index file ${file.path}:`, error);
      }
    }
  }

  // =============================================================================
  // SEARCH OPERATIONS
  // =============================================================================

  /**
   * Search files by content
   */
  async searchContent(query: SearchQuery): Promise<SearchResult[]> {
    const whereClause = this.buildSearchWhereClause(query);
    
    const indexes = await db.fileIndex.findMany({
      where: whereClause,
      include: {
        workspaceFile: true,
      },
      take: query.options.maxResults || 50,
    });

    const results: SearchResult[] = [];

    for (const index of indexes) {
      const matches = this.findMatches(index.content, query);
      if (matches.length > 0) {
        const score = this.calculateRelevanceScore(index, query, matches);
        const context = this.buildSearchContext(index);

        results.push({
          file: this.mapToWorkspaceFile(index.workspaceFile),
          matches,
          score,
          context,
        });
      }
    }

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Search for symbols (functions, classes, etc.)
   */
  async searchSymbols(symbolName: string, symbolType?: string): Promise<CodeSymbol[]> {
    const indexes = await db.fileIndex.findMany({
      where: {
        workspaceId: this.workspaceId,
        symbols: {
          path: ['$[*].name'],
          string_contains: symbolName,
        },
      },
    });

    const symbols: CodeSymbol[] = [];
    for (const index of indexes) {
      const fileSymbols = index.symbols as CodeSymbol[];
      const matchingSymbols = fileSymbols.filter(symbol => {
        const nameMatch = symbol.name.toLowerCase().includes(symbolName.toLowerCase());
        const typeMatch = !symbolType || symbol.type === symbolType;
        return nameMatch && typeMatch;
      });
      symbols.push(...matchingSymbols);
    }

    return symbols;
  }

  /**
   * Find references to a symbol
   */
  async findReferences(symbolName: string, filePath?: string): Promise<CodeSymbol[]> {
    const whereClause: any = {
      workspaceId: this.workspaceId,
    };

    if (filePath) {
      whereClause.path = filePath;
    }

    const indexes = await db.fileIndex.findMany({
      where: whereClause,
    });

    const references: CodeSymbol[] = [];
    for (const index of indexes) {
      const fileSymbols = index.symbols as CodeSymbol[];
      const symbolReferences = fileSymbols.filter(symbol => 
        symbol.name === symbolName && symbol.kind === 'reference'
      );
      references.push(...symbolReferences);
    }

    return references;
  }

  /**
   * Get file dependencies
   */
  async getDependencies(filePath: string): Promise<string[]> {
    const index = await db.fileIndex.findFirst({
      where: {
        workspaceId: this.workspaceId,
        path: filePath,
      },
    });

    return index?.dependencies as string[] || [];
  }

  /**
   * Get files that depend on a specific file
   */
  async getDependents(filePath: string): Promise<string[]> {
    const indexes = await db.fileIndex.findMany({
      where: {
        workspaceId: this.workspaceId,
        dependencies: {
          path: ['$[*]'],
          array_contains: [filePath],
        },
      },
    });

    return indexes.map(index => index.path);
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private tokenizeContent(content: string): string[] {
    // Simple tokenization - in production, use a proper tokenizer
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  private async extractSymbols(
    filePath: string,
    content: string,
    language?: string
  ): Promise<CodeSymbol[]> {
    const symbols: CodeSymbol[] = [];

    if (!language) return symbols;

    switch (language) {
      case 'javascript':
      case 'typescript':
        return this.extractJavaScriptSymbols(content, filePath);
      case 'python':
        return this.extractPythonSymbols(content, filePath);
      case 'java':
        return this.extractJavaSymbols(content, filePath);
      default:
        return this.extractGenericSymbols(content, filePath);
    }
  }

  private extractJavaScriptSymbols(content: string, filePath: string): CodeSymbol[] {
    const symbols: CodeSymbol[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineNumber) => {
      // Function declarations
      const functionMatch = line.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)\s*(?:=\s*(?:async\s+)?(?:function|\()|(?:\(.*?\)\s*=>))/);
      if (functionMatch) {
        symbols.push({
          name: functionMatch[1],
          type: 'function',
          kind: 'declaration',
          location: {
            file: filePath,
            line: lineNumber + 1,
            column: functionMatch.index! + 1,
          },
          modifiers: [],
          references: [],
        });
      }

      // Class declarations
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          type: 'class',
          kind: 'declaration',
          location: {
            file: filePath,
            line: lineNumber + 1,
            column: classMatch.index! + 1,
          },
          modifiers: [],
          references: [],
        });
      }

      // Variable declarations
      const varMatch = line.match(/(?:const|let|var)\s+(\w+)/);
      if (varMatch) {
        symbols.push({
          name: varMatch[1],
          type: 'variable',
          kind: 'declaration',
          location: {
            file: filePath,
            line: lineNumber + 1,
            column: varMatch.index! + 1,
          },
          modifiers: [],
          references: [],
        });
      }
    });

    return symbols;
  }

  private extractPythonSymbols(content: string, filePath: string): CodeSymbol[] {
    const symbols: CodeSymbol[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineNumber) => {
      // Function definitions
      const functionMatch = line.match(/def\s+(\w+)\s*\(/);
      if (functionMatch) {
        symbols.push({
          name: functionMatch[1],
          type: 'function',
          kind: 'declaration',
          location: {
            file: filePath,
            line: lineNumber + 1,
            column: functionMatch.index! + 1,
          },
          modifiers: [],
          references: [],
        });
      }

      // Class definitions
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          type: 'class',
          kind: 'declaration',
          location: {
            file: filePath,
            line: lineNumber + 1,
            column: classMatch.index! + 1,
          },
          modifiers: [],
          references: [],
        });
      }
    });

    return symbols;
  }

  private extractJavaSymbols(content: string, filePath: string): CodeSymbol[] {
    const symbols: CodeSymbol[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineNumber) => {
      // Method declarations
      const methodMatch = line.match(/(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(/);
      if (methodMatch) {
        symbols.push({
          name: methodMatch[1],
          type: 'function',
          kind: 'declaration',
          location: {
            file: filePath,
            line: lineNumber + 1,
            column: methodMatch.index! + 1,
          },
          modifiers: [],
          references: [],
        });
      }

      // Class declarations
      const classMatch = line.match(/(?:public|private)?\s*class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          type: 'class',
          kind: 'declaration',
          location: {
            file: filePath,
            line: lineNumber + 1,
            column: classMatch.index! + 1,
          },
          modifiers: [],
          references: [],
        });
      }
    });

    return symbols;
  }

  private extractGenericSymbols(content: string, filePath: string): CodeSymbol[] {
    // Generic symbol extraction for unknown languages
    const symbols: CodeSymbol[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineNumber) => {
      // Look for function-like patterns
      const functionMatch = line.match(/(\w+)\s*\(/);
      if (functionMatch) {
        symbols.push({
          name: functionMatch[1],
          type: 'function',
          kind: 'reference',
          location: {
            file: filePath,
            line: lineNumber + 1,
            column: functionMatch.index! + 1,
          },
          modifiers: [],
          references: [],
        });
      }
    });

    return symbols;
  }

  private extractImports(content: string, language?: string): any[] {
    // Implementation would depend on language
    return [];
  }

  private extractExports(content: string, language?: string): any[] {
    // Implementation would depend on language
    return [];
  }

  private extractDependencies(content: string, language?: string): string[] {
    const dependencies: string[] = [];

    if (!language) return dependencies;

    switch (language) {
      case 'javascript':
      case 'typescript':
        // Extract import statements
        const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
          importMatches.forEach(match => {
            const moduleMatch = match.match(/from\s+['"]([^'"]+)['"]/);
            if (moduleMatch) {
              dependencies.push(moduleMatch[1]);
            }
          });
        }
        break;

      case 'python':
        // Extract import statements
        const pythonImports = content.match(/(?:import|from)\s+(\w+)/g);
        if (pythonImports) {
          pythonImports.forEach(match => {
            const moduleMatch = match.match(/(?:import|from)\s+(\w+)/);
            if (moduleMatch) {
              dependencies.push(moduleMatch[1]);
            }
          });
        }
        break;
    }

    return dependencies;
  }

  private calculateComplexity(content: string, language?: string): any {
    // Simplified complexity calculation
    const lines = content.split('\n').length;
    const cyclomaticComplexity = (content.match(/if|while|for|switch|catch/g) || []).length + 1;
    
    return {
      cyclomatic: cyclomaticComplexity,
      cognitive: cyclomaticComplexity * 1.2,
      halstead: {
        vocabulary: 0,
        length: 0,
        difficulty: 0,
        effort: 0,
      },
      maintainabilityIndex: Math.max(0, 171 - 5.2 * Math.log(lines) - 0.23 * cyclomaticComplexity),
    };
  }

  private buildSearchWhereClause(query: SearchQuery): any {
    const whereClause: any = {
      workspaceId: this.workspaceId,
    };

    if (query.filters.languages?.length) {
      whereClause.language = {
        in: query.filters.languages,
      };
    }

    if (query.filters.paths?.length) {
      whereClause.path = {
        in: query.filters.paths,
      };
    }

    if (query.filters.excludePaths?.length) {
      whereClause.path = {
        ...whereClause.path,
        notIn: query.filters.excludePaths,
      };
    }

    return whereClause;
  }

  private findMatches(content: string, query: SearchQuery): any[] {
    const matches: any[] = [];
    const lines = content.split('\n');
    const searchTerm = query.options.caseSensitive ? query.query : query.query.toLowerCase();

    lines.forEach((line, lineNumber) => {
      const searchLine = query.options.caseSensitive ? line : line.toLowerCase();
      let index = 0;

      while ((index = searchLine.indexOf(searchTerm, index)) !== -1) {
        matches.push({
          line: lineNumber + 1,
          column: index + 1,
          length: searchTerm.length,
          text: line.substring(index, index + searchTerm.length),
          context: {
            before: line.substring(Math.max(0, index - 20), index),
            after: line.substring(index + searchTerm.length, Math.min(line.length, index + searchTerm.length + 20)),
          },
        });
        index += searchTerm.length;
      }
    });

    return matches;
  }

  private calculateRelevanceScore(index: any, query: SearchQuery, matches: any[]): number {
    let score = matches.length;

    // Boost score for exact matches
    if (matches.some(match => match.text === query.query)) {
      score *= 2;
    }

    // Boost score for matches in file name
    if (index.path.toLowerCase().includes(query.query.toLowerCase())) {
      score *= 1.5;
    }

    // Boost score for matches in symbols
    const symbols = index.symbols as CodeSymbol[];
    if (symbols.some(symbol => symbol.name.toLowerCase().includes(query.query.toLowerCase()))) {
      score *= 1.3;
    }

    return score;
  }

  private buildSearchContext(index: any): any {
    return {
      symbols: index.symbols || [],
      imports: index.imports || [],
      exports: index.exports || [],
      relatedFiles: index.dependencies || [],
    };
  }

  private async getFileContent(filePath: string): Promise<string | null> {
    // This would integrate with the file storage service
    // For now, return null as placeholder
    return null;
  }

  private mapToFileIndex(dbIndex: any): FileIndex {
    return {
      id: dbIndex.id,
      workspaceId: dbIndex.workspaceId,
      path: dbIndex.path,
      content: dbIndex.content,
      tokens: dbIndex.tokens,
      language: dbIndex.language,
      symbols: dbIndex.symbols,
      imports: dbIndex.imports,
      exports: dbIndex.exports,
      dependencies: dbIndex.dependencies,
      complexity: dbIndex.complexity,
      lastIndexed: dbIndex.lastIndexed,
      indexVersion: dbIndex.indexVersion,
    };
  }

  private mapToWorkspaceFile(dbFile: any): WorkspaceFile {
    return {
      id: dbFile.id,
      workspaceId: dbFile.workspaceId,
      path: dbFile.path,
      name: dbFile.name,
      type: dbFile.type,
      size: dbFile.size,
      mimeType: dbFile.mimeType,
      encoding: dbFile.encoding,
      hash: dbFile.hash,
      parentId: dbFile.parentId,
      isDirectory: dbFile.isDirectory,
      permissions: dbFile.permissions,
      metadata: dbFile.metadata,
      createdAt: dbFile.createdAt,
      updatedAt: dbFile.updatedAt,
      lastAccessedAt: dbFile.lastAccessedAt,
      version: dbFile.version,
    };
  }
}
