"use client";

import {
  Plus,
  Package,
  Monitor,
  Server,
  Zap,
  FolderOpen,
  Bot,
  FileText,
  Container,
  Database,
  Code,
  Play,
  Upload,
  Download,
  Settings,
  Terminal,
  Camera,
  HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  group: string;
}

const quickActions: QuickAction[] = [
  // Create Actions
  {
    title: "New Project",
    description: "Create a new development project",
    href: "/dashboard/projects/new",
    icon: Package,
    shortcut: "⌘⇧P",
    group: "Create",
  },
  {
    title: "New Workspace",
    description: "Set up a WebVM development workspace",
    href: "/dashboard/workspaces/new",
    icon: Monitor,
    shortcut: "⌘⇧W",
    group: "Create",
  },
  {
    title: "Launch WebVM",
    description: "Start a new WebVM instance",
    href: "/dashboard/webvm",
    icon: Play,
    shortcut: "⌘⇧V",
    group: "Create",
  },
  {
    title: "AI Assistant",
    description: "Open AI development assistant",
    href: "/dashboard/ai/assistant",
    icon: Bot,
    shortcut: "⌘⇧A",
    group: "Create",
  },

  // Deploy & Launch Actions
  {
    title: "Quick Deploy",
    description: "Deploy from template",
    href: "/dashboard/templates",
    icon: Zap,
    shortcut: "⌘⇧D",
    group: "Deploy",
  },
  {
    title: "Launch Terminal",
    description: "Open WebVM terminal",
    href: "/dashboard/webvm?tab=terminal",
    icon: Terminal,
    shortcut: "⌘⇧T",
    group: "Deploy",
  },
  {
    title: "Container Deploy",
    description: "Deploy container instance",
    href: "/dashboard/infrastructure/containers/new",
    icon: Container,
    group: "Deploy",
  },

  // Import & Management Actions
  {
    title: "Import Project",
    description: "Import existing project",
    href: "/dashboard/projects/import",
    icon: FolderOpen,
    shortcut: "⌘⇧I",
    group: "Import",
  },
  {
    title: "Upload Files",
    description: "Upload files to workspace",
    href: "/dashboard/files/upload",
    icon: Upload,
    group: "Import",
  },
  {
    title: "Clone Repository",
    description: "Clone Git repository",
    href: "/dashboard/projects/clone",
    icon: Code,
    group: "Import",
  },

  // Tools & Utilities
  {
    title: "File Browser",
    description: "Browse workspace files",
    href: "/dashboard/files",
    icon: FileText,
    shortcut: "⌘⇧F",
    group: "Tools",
  },
  {
    title: "System Monitor",
    description: "View system performance",
    href: "/dashboard/infrastructure/monitoring",
    icon: Server,
    group: "Tools",
  },
  {
    title: "Storage Manager",
    description: "Manage storage and backups",
    href: "/dashboard/files/analytics",
    icon: HardDrive,
    group: "Tools",
  },
  {
    title: "Create Snapshot",
    description: "Create instance snapshot",
    href: "/dashboard/instances/snapshots/new",
    icon: Camera,
    group: "Tools",
  },

  // Settings & Configuration
  {
    title: "Workspace Settings",
    description: "Configure workspace settings",
    href: "/dashboard/settings/workspace",
    icon: Settings,
    group: "Settings",
  },
  {
    title: "AI Configuration",
    description: "Configure AI models and settings",
    href: "/dashboard/settings/ai",
    icon: Bot,
    group: "Settings",
  },
];

export function QuickActions() {
  const groupedActions = quickActions.reduce((acc, action) => {
    if (!acc[action.group]) {
      acc[action.group] = [];
    }
    acc[action.group].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(groupedActions).map(([group, actions], groupIndex) => (
          <div key={group}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                {group}
              </DropdownMenuLabel>
              {actions.map((action) => (
                <DropdownMenuItem key={action.title} asChild>
                  <Link href={action.href} className="flex items-center">
                    <action.icon className="h-4 w-4 mr-3" />
                    <div className="flex-1">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                    {action.shortcut && (
                      <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
