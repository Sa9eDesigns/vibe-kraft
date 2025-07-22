'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Python,
  ArrowLeft,
  Settings,
  Share,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PyodideWorkspaceLayout } from './pyodide-workspace-layout';
import { usePyodide } from '../hooks/use-pyodide';
import { FileInfo } from '../core/pyodide-filesystem';

interface PyodideWorkspaceContainerProps {
  workspaceId: string;
  userId: string;
  workspace: {
    id: string;
    name: string;
    type: string;
    project?: {
      id: string;
      name: string;
      organizationId: string;
    };
  };
  className?: string;
}

export function PyodideWorkspaceContainer({
  workspaceId,
  userId,
  workspace,
  className
}: PyodideWorkspaceContainerProps) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const {
    isInitialized,
    isLoading,
    error,
    initialize,
    saveWorkspace,
    loadWorkspace,
    exportWorkspace,
    importWorkspace,
    markStateDirty,
    installedPackages
  } = usePyodide({
    workspaceId,
    autoInitialize: true
  });

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !isInitialized) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        await saveWorkspace();
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [autoSaveEnabled, isInitialized, saveWorkspace]);

  // Handle manual save
  const handleSave = useCallback(async () => {
    try {
      await saveWorkspace();
      setLastSaved(new Date());
      toast.success('Workspace saved successfully');
    } catch (error) {
      toast.error('Failed to save workspace');
      console.error('Save failed:', error);
    }
  }, [saveWorkspace]);

  // Handle workspace reload
  const handleReload = useCallback(async () => {
    try {
      await loadWorkspace();
      toast.success('Workspace reloaded');
    } catch (error) {
      toast.error('Failed to reload workspace');
      console.error('Reload failed:', error);
    }
  }, [loadWorkspace]);

  // Handle file operations
  const handleFileOpen = useCallback((file: FileInfo) => {
    console.log('Opening file:', file.path);
    markStateDirty();
  }, [markStateDirty]);

  const handleFileChange = useCallback((path: string, content: string) => {
    console.log('File changed:', path);
    markStateDirty();
    // Auto-save could be triggered here for individual files
  }, [markStateDirty]);

  // Handle navigation
  const handleBackToDashboard = useCallback(() => {
    if (workspace.project) {
      router.push(`/projects/${workspace.project.id}`);
    } else {
      router.push('/dashboard');
    }
  }, [router, workspace.project]);

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Workspace Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={initialize} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={handleBackToDashboard}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <Python className="h-12 w-12 text-primary" />
              <Loader2 className="h-6 w-6 absolute -top-1 -right-1 animate-spin text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Loading Python Workspace</h3>
              <p className="text-muted-foreground">
                Initializing Pyodide runtime...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      'h-screen w-screen flex flex-col bg-background',
      className
    )}>
      {/* Workspace Header */}
      {!isFullscreen && (
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Python className="h-5 w-5 text-primary" />
              <div>
                <h1 className="font-semibold text-sm">{workspace.name}</h1>
                {workspace.project && (
                  <p className="text-xs text-muted-foreground">
                    {workspace.project.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isInitialized ? (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs">
                {installedPackages.length} packages
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Last saved: {formatLastSaved(lastSaved)}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!isInitialized}
              className="h-8 px-2"
            >
              <Download className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReload}
              disabled={!isInitialized}
              className="h-8 px-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reload
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              className="h-8 px-2"
            >
              Fullscreen
            </Button>
          </div>
        </div>
      )}

      {/* Main Workspace Content */}
      <div className="flex-1 overflow-hidden">
        {isInitialized ? (
          <PyodideWorkspaceLayout
            workspaceId={workspaceId}
            onFileOpen={handleFileOpen}
            onFileChange={handleFileChange}
            className="h-full"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Python className="h-16 w-16 mx-auto text-primary opacity-50" />
              <div>
                <h3 className="text-lg font-semibold">Initializing Workspace</h3>
                <p className="text-muted-foreground">
                  Setting up your Python environment...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {isFullscreen && (
        <div className="flex items-center justify-between px-3 py-1 border-t bg-muted/30 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Python className="h-3 w-3" />
              <span>{workspace.name}</span>
            </div>
            
            {isInitialized && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Python Ready</span>
              </div>
            )}
            
            <div className="text-muted-foreground">
              {installedPackages.length} packages installed
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-muted-foreground">
              Auto-save: {autoSaveEnabled ? 'On' : 'Off'}
            </div>
            
            <div className="text-muted-foreground">
              Last saved: {formatLastSaved(lastSaved)}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="h-6 px-2 text-xs"
            >
              Exit Fullscreen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
