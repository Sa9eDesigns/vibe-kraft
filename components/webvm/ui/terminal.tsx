'use client';

import dynamic from 'next/dynamic';
import type { DevSandbox } from '../core/dev-sandbox';

// Dynamic import to avoid SSR issues with xterm
const TerminalClient = dynamic(
  () => import('./terminal-client').then(mod => ({ default: mod.TerminalClient })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full flex items-center justify-center border rounded-lg">
        <div className="text-muted-foreground">Loading terminal...</div>
      </div>
    )
  }
);

interface TerminalProps {
  sandbox: DevSandbox;
  className?: string;
  aiIntegration?: boolean;
  onCommandExecute?: (command: string) => void;
  onOutput?: (output: string) => void;
}

export function Terminal(props: TerminalProps) {
  return <TerminalClient {...props} />;
}