'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Terminal, 
  FileText, 
  Code, 
  Camera, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Copy,
  ExternalLink,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ToolExecution {
  id: string;
  name: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  result?: any;
  error?: string;
  progress?: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  logs?: string[];
}

interface ToolExecutionVisualizerProps {
  executions: ToolExecution[];
  onRetry?: (execution: ToolExecution) => void;
  onCancel?: (execution: ToolExecution) => void;
  onClear?: (executionId: string) => void;
  onClearAll?: () => void;
  className?: string;
  maxHeight?: string;
  showLogs?: boolean;
  autoScroll?: boolean;
}

export function ToolExecutionVisualizer({
  executions,
  onRetry,
  onCancel,
  onClear,
  onClearAll,
  className,
  maxHeight = '400px',
  showLogs = true,
  autoScroll = true
}: ToolExecutionVisualizerProps) {
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'error'>('all');

  // Auto-expand running executions
  useEffect(() => {
    if (autoScroll) {
      const runningExecutions = executions.filter(e => e.status === 'running');
      if (runningExecutions.length > 0) {
        setExpandedExecutions(prev => {
          const newSet = new Set(prev);
          runningExecutions.forEach(e => newSet.add(e.id));
          return newSet;
        });
      }
    }
  }, [executions, autoScroll]);

  const toggleExpanded = useCallback((executionId: string) => {
    setExpandedExecutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(executionId)) {
        newSet.delete(executionId);
      } else {
        newSet.add(executionId);
      }
      return newSet;
    });
  }, []);

  const getToolIcon = (toolName: string) => {
    switch (toolName.toLowerCase()) {
      case 'bash':
      case 'terminal':
        return <Terminal className="w-4 h-4" />;
      case 'readfile':
      case 'writefile':
      case 'listfiles':
        return <FileText className="w-4 h-4" />;
      case 'generatecode':
      case 'analyzecode':
        return <Code className="w-4 h-4" />;
      case 'screenshot':
        return <Camera className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ToolExecution['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'cancelled':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: ToolExecution['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'running':
        return <Play className="w-4 h-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <Square className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      return `${(duration / 60000).toFixed(1)}m`;
    }
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, []);

  const filteredExecutions = executions.filter(execution => {
    if (filter === 'all') return true;
    return execution.status === filter;
  });

  const runningCount = executions.filter(e => e.status === 'running').length;
  const completedCount = executions.filter(e => e.status === 'completed').length;
  const errorCount = executions.filter(e => e.status === 'error').length;

  if (executions.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <Terminal className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No tool executions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Tool Executions ({executions.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Status badges */}
            {runningCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {runningCount} running
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {errorCount} errors
              </Badge>
            )}
            
            {/* Actions */}
            {onClearAll && executions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'running', 'completed', 'error'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="h-6 text-xs capitalize"
            >
              {filterType}
              {filterType !== 'all' && (
                <Badge variant="outline" className="ml-1 text-xs">
                  {executions.filter(e => e.status === filterType).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="px-4 pb-4" style={{ maxHeight }}>
          <div className="space-y-2">
            {filteredExecutions.map((execution) => (
              <Collapsible
                key={execution.id}
                open={expandedExecutions.has(execution.id)}
                onOpenChange={() => toggleExpanded(execution.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {getToolIcon(execution.name)}
                        <span className="text-sm font-medium">{execution.name}</span>
                      </div>
                      
                      <div className={cn("flex items-center gap-1", getStatusColor(execution.status))}>
                        {getStatusIcon(execution.status)}
                        <span className="text-xs capitalize">{execution.status}</span>
                      </div>
                      
                      {execution.status === 'running' && execution.progress !== undefined && (
                        <div className="flex items-center gap-2 flex-1 max-w-32">
                          <Progress value={execution.progress} className="h-1" />
                          <span className="text-xs text-muted-foreground">
                            {execution.progress}%
                          </span>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(execution.startTime, execution.endTime)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Action buttons */}
                      {execution.status === 'running' && onCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancel(execution);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Square className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {execution.status === 'error' && onRetry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetry(execution);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {onClear && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClear(execution.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {expandedExecutions.has(execution.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="px-3 pb-3">
                  <div className="mt-2 space-y-3 text-sm">
                    {/* Parameters */}
                    {Object.keys(execution.parameters).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Parameters</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(execution.parameters, null, 2))}
                            className="h-5 w-5 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="bg-muted rounded p-2 text-xs font-mono">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(execution.parameters, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {/* Result */}
                    {execution.result && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Result</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(typeof execution.result === 'string' ? execution.result : JSON.stringify(execution.result, null, 2))}
                            className="h-5 w-5 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="bg-muted rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">
                            {typeof execution.result === 'string' 
                              ? execution.result 
                              : JSON.stringify(execution.result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {/* Error */}
                    {execution.error && (
                      <div>
                        <span className="text-xs font-medium text-red-500">Error</span>
                        <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
                          {execution.error}
                        </div>
                      </div>
                    )}
                    
                    {/* Logs */}
                    {showLogs && execution.logs && execution.logs.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Logs</span>
                        <div className="bg-black text-green-400 rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
                          {execution.logs.map((log, index) => (
                            <div key={index}>{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
