'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';
import { FirecrackerWorkspace } from '@/lib/types/firecracker';

interface FirecrackerCodeEditorProps {
  workspace: FirecrackerWorkspace;
  className?: string;
}

export function FirecrackerCodeEditor({ workspace, className }: FirecrackerCodeEditorProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Code className="h-4 w-4" />
          Code Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
          <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Firecracker Code Editor</p>
          <p className="text-xs">Monaco editor integration coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
