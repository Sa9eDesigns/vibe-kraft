"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Package,
  Monitor,
  Server,
  Plus,
  Search,
  Home,
  BarChart3,
  Users,
  Shield,
  HelpCircle,
  Terminal,
  Database,
  Activity,
  Layers,
  FolderOpen,
  Zap
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action?: () => void;
  group: string;
}

const commands: CommandItem[] = [
  // Navigation
  {
    id: "nav-dashboard",
    title: "Dashboard",
    description: "Go to dashboard overview",
    href: "/dashboard",
    icon: Home,
    shortcut: "⌘D",
    group: "Navigation",
  },
  {
    id: "nav-management",
    title: "Management",
    description: "Manage projects, workspaces, and instances",
    href: "/dashboard/management",
    icon: BarChart3,
    shortcut: "⌘M",
    group: "Navigation",
  },
  {
    id: "nav-projects",
    title: "Projects",
    description: "View all projects",
    href: "/dashboard/projects",
    icon: Package,
    shortcut: "⌘P",
    group: "Navigation",
  },
  {
    id: "nav-workspaces",
    title: "Workspaces",
    description: "View all workspaces",
    href: "/dashboard/workspaces",
    icon: Monitor,
    shortcut: "⌘W",
    group: "Navigation",
  },
  {
    id: "nav-instances",
    title: "WebVM Instances",
    description: "View all WebVM instances",
    href: "/dashboard/instances",
    icon: Server,
    shortcut: "⌘I",
    group: "Navigation",
  },
  {
    id: "nav-webvm",
    title: "WebVM Workspace",
    description: "Access WebVM workspace",
    href: "/dashboard/webvm",
    icon: Terminal,
    shortcut: "⌘T",
    group: "Navigation",
  },

  // Quick Actions
  {
    id: "action-new-project",
    title: "Create New Project",
    description: "Start a new project",
    href: "/dashboard/projects/new",
    icon: Plus,
    shortcut: "⌘⇧P",
    group: "Quick Actions",
  },
  {
    id: "action-new-workspace",
    title: "Create New Workspace",
    description: "Set up a new workspace",
    href: "/dashboard/workspaces/new",
    icon: Layers,
    shortcut: "⌘⇧W",
    group: "Quick Actions",
  },
  {
    id: "action-new-instance",
    title: "Launch WebVM Instance",
    description: "Create a new WebVM instance",
    href: "/dashboard/instances/new",
    icon: Zap,
    shortcut: "⌘⇧I",
    group: "Quick Actions",
  },

  // Organization
  {
    id: "org-team",
    title: "Team Management",
    description: "Manage team members",
    href: "/dashboard/team",
    icon: Users,
    group: "Organization",
  },
  {
    id: "org-analytics",
    title: "Analytics",
    description: "View analytics and insights",
    href: "/dashboard/analytics",
    icon: BarChart3,
    group: "Organization",
  },
  {
    id: "org-security",
    title: "Security Settings",
    description: "Manage security and permissions",
    href: "/dashboard/security",
    icon: Shield,
    group: "Organization",
  },

  // Settings & Support
  {
    id: "settings-general",
    title: "Settings",
    description: "Configure your preferences",
    href: "/dashboard/settings",
    icon: Settings,
    shortcut: "⌘,",
    group: "Settings",
  },
  {
    id: "support-help",
    title: "Help & Support",
    description: "Get help and documentation",
    href: "/dashboard/help",
    icon: HelpCircle,
    shortcut: "⌘?",
    group: "Settings",
  },

  // Filters
  {
    id: "filter-active-workspaces",
    title: "Active Workspaces",
    description: "Show only active workspaces",
    href: "/dashboard/workspaces?status=active",
    icon: Activity,
    group: "Filters",
  },
  {
    id: "filter-running-instances",
    title: "Running Instances",
    description: "Show only running instances",
    href: "/dashboard/instances?status=running",
    icon: Zap,
    group: "Filters",
  },
  {
    id: "filter-metrics",
    title: "Instance Metrics",
    description: "View instance performance metrics",
    href: "/dashboard/instances/metrics",
    icon: BarChart3,
    group: "Filters",
  },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (command: CommandItem) => {
    onOpenChange(false);
    if (command.action) {
      command.action();
    } else if (command.href) {
      router.push(command.href);
    }
  };

  const filteredCommands = commands.filter((command) =>
    command.title.toLowerCase().includes(search.toLowerCase()) ||
    command.description?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.group]) {
      acc[command.group] = [];
    }
    acc[command.group].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groupedCommands).map(([group, items], index) => (
          <div key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((command) => (
                <CommandItem
                  key={command.id}
                  value={command.title}
                  onSelect={() => handleSelect(command)}
                  className="flex items-center gap-2"
                >
                  <command.icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{command.title}</div>
                    {command.description && (
                      <div className="text-xs text-muted-foreground">
                        {command.description}
                      </div>
                    )}
                  </div>
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
