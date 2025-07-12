/**
 * Workspace Persistence Types
 * Comprehensive type definitions for persistent remote workspaces
 */

// =============================================================================
// CORE WORKSPACE TYPES
// =============================================================================

export interface WorkspaceFile {
  id: string;
  workspaceId: string;
  path: string;
  name: string;
  type: FileType;
  size: number;
  mimeType: string;
  encoding: string;
  content?: string; // For text files
  hash: string; // SHA-256 hash for integrity
  parentId?: string; // For directory structure
  isDirectory: boolean;
  permissions: FilePermissions;
  metadata: FileMetadata;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  version: number;
}

export interface FileMetadata {
  language?: string; // Programming language
  lineCount?: number;
  characterCount?: number;
  isExecutable?: boolean;
  isBinary?: boolean;
  gitTracked?: boolean;
  tags?: string[];
  description?: string;
  customProperties?: Record<string, any>;
}

export interface FilePermissions {
  owner: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  group: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  other: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
}

export type FileType = 
  | 'text'
  | 'binary'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'executable'
  | 'symlink'
  | 'directory';

// =============================================================================
// WORKSPACE STATE TYPES
// =============================================================================

export interface WorkspaceState {
  id: string;
  workspaceId: string;
  sessionId: string;
  environment: EnvironmentState;
  processes: ProcessState[];
  openFiles: OpenFileState[];
  terminalSessions: TerminalState[];
  editorState: EditorState;
  gitState: GitState;
  installedPackages: PackageState[];
  customSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnvironmentState {
  variables: Record<string, string>;
  path: string[];
  workingDirectory: string;
  shell: string;
  locale: string;
  timezone: string;
}

export interface ProcessState {
  pid: number;
  name: string;
  command: string;
  args: string[];
  cwd: string;
  environment: Record<string, string>;
  status: 'running' | 'stopped' | 'zombie';
  startTime: Date;
  cpuUsage: number;
  memoryUsage: number;
}

export interface OpenFileState {
  path: string;
  cursorPosition: {
    line: number;
    column: number;
  };
  scrollPosition: {
    top: number;
    left: number;
  };
  selections: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }>;
  isDirty: boolean;
  lastModified: Date;
}

export interface TerminalState {
  id: string;
  title: string;
  cwd: string;
  environment: Record<string, string>;
  history: string[];
  scrollback: string[];
  size: {
    rows: number;
    cols: number;
  };
  isActive: boolean;
}

export interface EditorState {
  theme: string;
  fontSize: number;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  extensions: string[];
  keybindings: Record<string, string>;
}

export interface GitState {
  repository?: {
    url: string;
    branch: string;
    commit: string;
    remotes: Array<{
      name: string;
      url: string;
    }>;
  };
  status: {
    staged: string[];
    unstaged: string[];
    untracked: string[];
    conflicts: string[];
  };
  stashes: Array<{
    id: string;
    message: string;
    date: Date;
  }>;
}

export interface PackageState {
  name: string;
  version: string;
  manager: 'npm' | 'pip' | 'cargo' | 'go' | 'apt' | 'yum' | 'brew' | 'other';
  isGlobal: boolean;
  isDev: boolean;
  installedAt: Date;
}

// =============================================================================
// WORKSPACE SNAPSHOT TYPES
// =============================================================================

export interface WorkspaceSnapshot {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: SnapshotType;
  size: number;
  fileCount: number;
  state: WorkspaceState;
  files: WorkspaceFile[];
  storageLocation: string;
  compression: CompressionType;
  encryption: EncryptionInfo;
  metadata: SnapshotMetadata;
  createdAt: Date;
  expiresAt?: Date;
}

export type SnapshotType = 
  | 'manual'
  | 'automatic'
  | 'checkpoint'
  | 'backup'
  | 'template';

export type CompressionType = 
  | 'none'
  | 'gzip'
  | 'brotli'
  | 'lz4'
  | 'zstd';

export interface EncryptionInfo {
  enabled: boolean;
  algorithm?: string;
  keyId?: string;
}

export interface SnapshotMetadata {
  tags: string[];
  author: string;
  version: string;
  dependencies: string[];
  runtime: string;
  architecture: string;
  customData: Record<string, any>;
}

// =============================================================================
// FILE INDEXING TYPES
// =============================================================================

export interface FileIndex {
  id: string;
  workspaceId: string;
  path: string;
  content: string;
  tokens: string[];
  language: string;
  symbols: CodeSymbol[];
  imports: ImportStatement[];
  exports: ExportStatement[];
  dependencies: string[];
  complexity: CodeComplexity;
  lastIndexed: Date;
  indexVersion: string;
}

export interface CodeSymbol {
  name: string;
  type: SymbolType;
  kind: SymbolKind;
  location: SourceLocation;
  signature?: string;
  documentation?: string;
  modifiers: string[];
  references: SourceLocation[];
}

export type SymbolType = 
  | 'function'
  | 'class'
  | 'interface'
  | 'variable'
  | 'constant'
  | 'type'
  | 'enum'
  | 'namespace'
  | 'module';

export type SymbolKind = 
  | 'declaration'
  | 'definition'
  | 'reference'
  | 'call'
  | 'assignment';

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface ImportStatement {
  module: string;
  imports: Array<{
    name: string;
    alias?: string;
    isDefault?: boolean;
  }>;
  location: SourceLocation;
}

export interface ExportStatement {
  name: string;
  type: string;
  isDefault: boolean;
  location: SourceLocation;
}

export interface CodeComplexity {
  cyclomatic: number;
  cognitive: number;
  halstead: {
    vocabulary: number;
    length: number;
    difficulty: number;
    effort: number;
  };
  maintainabilityIndex: number;
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

export interface SearchQuery {
  query: string;
  type: SearchType;
  filters: SearchFilters;
  options: SearchOptions;
}

export type SearchType = 
  | 'content'
  | 'filename'
  | 'symbol'
  | 'reference'
  | 'semantic';

export interface SearchFilters {
  fileTypes?: string[];
  languages?: string[];
  paths?: string[];
  excludePaths?: string[];
  modifiedAfter?: Date;
  modifiedBefore?: Date;
  sizeMin?: number;
  sizeMax?: number;
  tags?: string[];
}

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  fuzzy?: boolean;
  maxResults?: number;
  includeContent?: boolean;
  highlightMatches?: boolean;
}

export interface SearchResult {
  file: WorkspaceFile;
  matches: SearchMatch[];
  score: number;
  context: SearchContext;
}

export interface SearchMatch {
  line: number;
  column: number;
  length: number;
  text: string;
  context: {
    before: string;
    after: string;
  };
}

export interface SearchContext {
  symbols: CodeSymbol[];
  imports: ImportStatement[];
  exports: ExportStatement[];
  relatedFiles: string[];
}

// =============================================================================
// WORKSPACE SYNC TYPES
// =============================================================================

export interface WorkspaceSync {
  id: string;
  workspaceId: string;
  type: SyncType;
  status: SyncStatus;
  direction: SyncDirection;
  source: SyncEndpoint;
  target: SyncEndpoint;
  progress: SyncProgress;
  conflicts: SyncConflict[];
  lastSync: Date;
  nextSync?: Date;
  settings: SyncSettings;
}

export type SyncType = 
  | 'realtime'
  | 'periodic'
  | 'manual'
  | 'ondemand';

export type SyncStatus = 
  | 'idle'
  | 'syncing'
  | 'conflict'
  | 'error'
  | 'paused';

export type SyncDirection = 
  | 'upload'
  | 'download'
  | 'bidirectional';

export interface SyncEndpoint {
  type: 'local' | 'remote' | 'git' | 's3' | 'ftp';
  url: string;
  credentials?: Record<string, string>;
  options?: Record<string, any>;
}

export interface SyncProgress {
  totalFiles: number;
  processedFiles: number;
  totalBytes: number;
  processedBytes: number;
  currentFile?: string;
  speed: number; // bytes per second
  eta: number; // seconds
}

export interface SyncConflict {
  path: string;
  type: ConflictType;
  localVersion: FileVersion;
  remoteVersion: FileVersion;
  resolution?: ConflictResolution;
}

export type ConflictType = 
  | 'content'
  | 'delete'
  | 'rename'
  | 'permission';

export interface FileVersion {
  hash: string;
  size: number;
  modifiedAt: Date;
  author?: string;
}

export type ConflictResolution = 
  | 'local'
  | 'remote'
  | 'merge'
  | 'skip';

export interface SyncSettings {
  excludePatterns: string[];
  includePatterns: string[];
  maxFileSize: number;
  preservePermissions: boolean;
  preserveTimestamps: boolean;
  deleteExtraFiles: boolean;
  retryAttempts: number;
  retryDelay: number;
}
