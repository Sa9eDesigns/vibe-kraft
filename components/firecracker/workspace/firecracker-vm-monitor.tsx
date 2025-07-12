'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor } from 'lucide-react';
import { FirecrackerWorkspace, FirecrackerVMStatus } from '@/lib/types/firecracker';

interface FirecrackerVMMonitorProps {
  workspace: FirecrackerWorkspace;
  vmStatus: FirecrackerVMStatus;
  className?: string;
}

export function FirecrackerVMMonitor({ workspace, vmStatus, className }: FirecrackerVMMonitorProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          VM Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
          <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Firecracker VM Monitor</p>
          <p className="text-xs">Real-time VM metrics and monitoring</p>
        </div>
      </CardContent>
    </Card>
  );
}
