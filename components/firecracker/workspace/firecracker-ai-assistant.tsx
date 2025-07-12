'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { FirecrackerWorkspace } from '@/lib/types/firecracker';

interface FirecrackerAIAssistantProps {
  workspace: FirecrackerWorkspace;
  className?: string;
}

export function FirecrackerAIAssistant({ workspace, className }: FirecrackerAIAssistantProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
          <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Firecracker AI Assistant</p>
          <p className="text-xs">AI integration for Firecracker workspaces</p>
        </div>
      </CardContent>
    </Card>
  );
}
