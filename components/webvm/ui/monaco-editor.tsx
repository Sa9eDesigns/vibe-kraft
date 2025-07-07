'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Save, 
  FileText, 
  Settings, 
  Maximize2, 
  Minimize2,
  Bot,
  Code2,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DevSandbox } from '../core/dev-sandbox';
import type { EditorConfig } from '../types';

interface CodeEditorProps {
  sandbox: DevSandbox;
  initialFile?: string;
  language?: string;
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  aiAssistance?: boolean;
  onFileChange?: (file: string, content: string) => void;
  onRun?: (code: string) => void;
  className?: string;
  height?: string | number;
  width?: string | number;
  readOnly?: boolean;
  config?: Partial<EditorConfig>;
}

export function CodeEditor({
  sandbox,
  initialFile = '/workspace/main.py',
  language = 'python',
  theme,
  aiAssistance = false,
  onFileChange,
  onRun,
  className,
  height = '100%',
  width = '100%',
  readOnly = false,
  config = {}
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { theme: systemTheme } = useTheme();
  const [currentFile, setCurrentFile] = useState(initialFile);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());

  // Default editor configuration
  const defaultConfig: EditorConfig = {
    language,
    theme: theme || (systemTheme === 'dark' ? 'vs-dark' : 'vs'),
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Monaco, Consolas, "Courier New", monospace',
    lineNumbers: 'on',
    wordWrap: 'on',
    minimap: {
      enabled: true,
      side: 'right',
      size: 'proportional'
    },
    autoIndent: 'advanced',
    formatOnSave: true,
    formatOnType: true,
    linting: true,
    intelliSense: true,
    ...config
  };

  // Load file content
  const loadFile = useCallback(async (filePath: string) => {
    if (!sandbox.isReady()) return;
    
    try {
      setIsLoading(true);
      const fileContent = await sandbox.readFile(filePath);
      setContent(fileContent);
      setCurrentFile(filePath);
      
      // Update editor content
      if (editorRef.current) {
        editorRef.current.setValue(fileContent);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      setContent('// Failed to load file\n// Error: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sandbox]);

  // Save file
  const saveFile = useCallback(async () => {
    if (!sandbox.isReady() || !editorRef.current) return;
    
    try {
      setIsSaving(true);
      const currentContent = editorRef.current.getValue();
      await sandbox.writeFile(currentFile, currentContent);
      
      // Remove from modified files
      setModifiedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentFile);
        return newSet;
      });
      
      onFileChange?.(currentFile, currentContent);
    } catch (error) {
      console.error('Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  }, [sandbox, currentFile, onFileChange]);

  // Run code
  const runCode = useCallback(async () => {
    if (!sandbox.isReady() || !editorRef.current) return;
    
    try {
      setIsRunning(true);
      const code = editorRef.current.getValue();
      
      // Save before running
      await saveFile();
      
      // Execute based on language
      const command = getExecutionCommand(language, currentFile);
      if (command) {
        await sandbox.executeCommand(command.cmd, command.args);
      }
      
      onRun?.(code);
    } catch (error) {
      console.error('Failed to run code:', error);
    } finally {
      setIsRunning(false);
    }
  }, [sandbox, language, currentFile, saveFile, onRun]);

  // Get execution command based on language
  const getExecutionCommand = (lang: string, file: string): { cmd: string; args: string[] } | null => {
    const commands: Record<string, { cmd: string; args: string[] }> = {
      python: { cmd: '/usr/bin/python3', args: [file] },
      javascript: { cmd: '/usr/bin/node', args: [file] },
      typescript: { cmd: '/usr/bin/npx', args: ['ts-node', file] },
      bash: { cmd: '/bin/bash', args: [file] },
      c: { cmd: '/usr/bin/gcc', args: [file, '-o', file.replace('.c', ''), '&&', './' + file.replace('.c', '')] },
      cpp: { cmd: '/usr/bin/g++', args: [file, '-o', file.replace('.cpp', ''), '&&', './' + file.replace('.cpp', '')] },
      rust: { cmd: '/usr/bin/rustc', args: [file, '&&', './' + file.replace('.rs', '')] },
      go: { cmd: '/usr/bin/go', args: ['run', file] },
      java: { cmd: '/usr/bin/javac', args: [file, '&&', 'java', file.replace('.java', '')] }
    };
    
    return commands[lang] || null;
  };

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.updateOptions({
      fontSize: defaultConfig.fontSize,
      fontFamily: defaultConfig.fontFamily,
      lineNumbers: defaultConfig.lineNumbers,
      wordWrap: defaultConfig.wordWrap,
      minimap: defaultConfig.minimap,
      autoIndent: defaultConfig.autoIndent,
      formatOnSave: defaultConfig.formatOnSave,
      formatOnType: defaultConfig.formatOnType,
      readOnly
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F5, () => {
      runCode();
    });

    // Track changes
    editor.onDidChangeModelContent(() => {
      setModifiedFiles(prev => new Set(prev).add(currentFile));
    });

    // Load initial file
    loadFile(currentFile);
  }, [currentFile, defaultConfig, readOnly, saveFile, runCode, loadFile]);

  // Handle content change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
    }
  }, []);

  // AI assistance
  const requestAIAssistance = useCallback(async () => {
    if (!aiAssistance || !sandbox.isReady() || !editorRef.current) return;
    
    try {
      const code = editorRef.current.getValue();
      const response = await sandbox.aiAssist(
        `Please analyze this ${language} code and provide suggestions for improvement:\n\n${code}`,
        { 
          file: currentFile,
          language,
          context: 'code-review'
        }
      );
      
      if (response.type === 'text') {
        setAiSuggestions([response.content]);
        setShowAI(true);
      }
    } catch (error) {
      console.error('AI assistance failed:', error);
    }
  }, [aiAssistance, sandbox, language, currentFile]);

  // Initialize sandbox connection
  useEffect(() => {
    if (sandbox.isReady()) {
      loadFile(currentFile);
    } else {
      sandbox.onReady(() => {
        loadFile(currentFile);
      });
    }
  }, [sandbox, currentFile, loadFile]);

  const isModified = modifiedFiles.has(currentFile);

  return (
    <Card className={cn('flex flex-col h-full', isMaximized && 'fixed inset-0 z-50', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Code Editor
            {isModified && (
              <Badge variant="outline" className="ml-2">
                Modified
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {aiAssistance && (
              <Button
                variant="outline"
                size="sm"
                onClick={requestAIAssistance}
                disabled={!sandbox.isReady()}
              >
                <Bot className="h-4 w-4" />
                AI Help
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveFile}
              disabled={!sandbox.isReady() || isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={runCode}
              disabled={!sandbox.isReady() || isRunning}
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            
            <Separator orientation="vertical" className="h-4" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>{currentFile}</span>
          <Badge variant="secondary">{language}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <div className="h-full relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <Editor
              height={height}
              width={width}
              language={language}
              theme={defaultConfig.theme}
              value={content}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly,
                cursorStyle: 'line',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                contextmenu: true,
                copyWithSyntaxHighlighting: true,
                dragAndDrop: true,
                find: {
                  addExtraSpaceOnTop: false,
                  autoFindInSelection: 'never',
                  seedSearchStringFromSelection: 'always'
                },
                folding: true,
                foldingHighlight: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'mouseover',
                unfoldOnClickAfterEndOfLine: true,
                bracketPairColorization: {
                  enabled: true,
                  independentColorPoolPerBracketType: false
                },
                colorDecorators: true,
                lightbulb: {
                  enabled: true
                },
                hover: {
                  enabled: true,
                  delay: 300,
                  sticky: true
                },
                links: true,
                multiCursorMergeOverlapping: true,
                multiCursorModifier: 'alt',
                suggest: {
                  enabled: true,
                  showIcons: true,
                  showStatusBar: true,
                  showInlineDetails: true,
                  showKeywords: true,
                  showSnippets: true
                },
                tabCompletion: 'on',
                wordBasedSuggestions: 'allDocuments',
                ...config
              }}
            />
          )}
          
          {showAI && aiSuggestions.length > 0 && (
            <div className="absolute top-4 right-4 w-80 bg-background border rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium">AI Suggestions</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAI(false)}
                >
                  ×
                </Button>
              </div>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}