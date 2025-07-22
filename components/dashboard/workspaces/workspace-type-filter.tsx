'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Monitor, Server, Filter, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceTypeFilterProps {
  selectedType?: 'WEBVM' | 'FIRECRACKER' | 'ALL';
  onTypeChange: (type: 'WEBVM' | 'FIRECRACKER' | 'ALL') => void;
  webvmCount?: number;
  firecrackerCount?: number;
  className?: string;
}

export function WorkspaceTypeFilter({
  selectedType = 'ALL',
  onTypeChange,
  webvmCount = 0,
  firecrackerCount = 0,
  className
}: WorkspaceTypeFilterProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WEBVM':
        return <Monitor className="h-4 w-4" />;
      case 'FIRECRACKER':
        return <Server className="h-4 w-4" />;
      default:
        return <Filter className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'WEBVM':
        return 'WebVM';
      case 'FIRECRACKER':
        return 'Firecracker';
      default:
        return 'All Types';
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'WEBVM':
        return 'Browser-based development environments';
      case 'FIRECRACKER':
        return 'MicroVM with container orchestration';
      default:
        return 'Show all workspace types';
    }
  };

  const getTypeCount = (type: string) => {
    switch (type) {
      case 'WEBVM':
        return webvmCount;
      case 'FIRECRACKER':
        return firecrackerCount;
      default:
        return webvmCount + firecrackerCount;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("gap-2", className)}>
          {getTypeIcon(selectedType)}
          {getTypeLabel(selectedType)}
          <Badge variant="secondary" className="ml-1">
            {getTypeCount(selectedType)}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem
          onClick={() => onTypeChange('ALL')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <div>
              <div className="font-medium">All Types</div>
              <div className="text-xs text-muted-foreground">
                Show all workspace types
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {webvmCount + firecrackerCount}
            </Badge>
            {selectedType === 'ALL' && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => onTypeChange('WEBVM')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <div>
              <div className="font-medium">WebVM</div>
              <div className="text-xs text-muted-foreground">
                Browser-based development environments
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {webvmCount}
            </Badge>
            {selectedType === 'WEBVM' && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => onTypeChange('FIRECRACKER')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <div>
              <div className="font-medium">Firecracker</div>
              <div className="text-xs text-muted-foreground">
                MicroVM with container orchestration
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {firecrackerCount}
            </Badge>
            {selectedType === 'FIRECRACKER' && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
