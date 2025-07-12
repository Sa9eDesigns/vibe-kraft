"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Monitor,
  Server,
  Settings,
  Users,
  BarChart3,
  FolderOpen,
  Activity,
  Home,
  Layers,
  Database,
  Terminal,
  Zap,
  Shield,
  HelpCircle,
  Plus,
  Search,
  MoreHorizontal,
  ChevronRight,
  Bot,
  Container,
  HardDrive,
  Cpu,
  MemoryStick,
  FileText,
  Code,
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Workflow,
  Camera
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusIndicator } from "./status-indicator";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Management",
    href: "/dashboard/management",
    icon: LayoutDashboard,
    badge: "Enhanced",
  },
  {
    title: "Projects",
    icon: Package,
    children: [
      {
        title: "All Projects",
        href: "/dashboard/projects",
        icon: FolderOpen,
      },
      {
        title: "Create Project",
        href: "/dashboard/projects/new",
        icon: Plus,
      },
      {
        title: "Project Templates",
        href: "/dashboard/projects/templates",
        icon: Layers,
      },
    ],
  },
  {
    title: "WebVM Workspaces",
    icon: Monitor,
    children: [
      {
        title: "All Workspaces",
        href: "/dashboard/workspaces",
        icon: Layers,
      },
      {
        title: "Active Workspaces",
        href: "/dashboard/workspaces?status=active",
        icon: Activity,
      },
      {
        title: "Launch Workspace",
        href: "/dashboard/webvm",
        icon: Play,
      },
      {
        title: "Workspace Templates",
        href: "/dashboard/workspaces/templates",
        icon: Code,
      },
    ],
  },
  {
    title: "WebVM Instances",
    icon: Server,
    children: [
      {
        title: "All Instances",
        href: "/dashboard/instances",
        icon: Database,
      },
      {
        title: "Running Instances",
        href: "/dashboard/instances?status=running",
        icon: Zap,
      },
      {
        title: "Instance Metrics",
        href: "/dashboard/instances/metrics",
        icon: BarChart3,
      },
      {
        title: "Instance Snapshots",
        href: "/dashboard/instances/snapshots",
        icon: Camera,
      },
    ],
  },
  {
    title: "AI Development Tools",
    icon: Bot,
    badge: "AI",
    children: [
      {
        title: "AI Assistant",
        href: "/dashboard/ai/assistant",
        icon: Bot,
      },
      {
        title: "Code Generation",
        href: "/dashboard/ai/codegen",
        icon: Code,
      },
      {
        title: "AI Workflows",
        href: "/dashboard/ai/workflows",
        icon: Workflow,
      },
      {
        title: "Usage Analytics",
        href: "/dashboard/ai/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "File Management",
    icon: FileText,
    children: [
      {
        title: "File Browser",
        href: "/dashboard/files",
        icon: FolderOpen,
      },
      {
        title: "Storage Analytics",
        href: "/dashboard/files/analytics",
        icon: HardDrive,
      },
      {
        title: "Backup & Sync",
        href: "/dashboard/files/backup",
        icon: Database,
      },
    ],
  },
  {
    title: "Infrastructure",
    icon: Container,
    children: [
      {
        title: "Container Management",
        href: "/dashboard/infrastructure/containers",
        icon: Container,
      },
      {
        title: "Resource Monitoring",
        href: "/dashboard/infrastructure/monitoring",
        icon: Activity,
      },
      {
        title: "Performance Metrics",
        href: "/dashboard/infrastructure/metrics",
        icon: TrendingUp,
      },
      {
        title: "System Health",
        href: "/dashboard/infrastructure/health",
        icon: Shield,
      },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: "Team & Collaboration",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Advanced Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    badge: "Pro",
  },
  {
    title: "Security & Compliance",
    href: "/dashboard/security",
    icon: Shield,
  },
  {
    title: "System Monitoring",
    href: "/dashboard/monitoring",
    icon: Activity,
  },
  {
    title: "Settings & Config",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Help & Documentation",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  const isItemActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const hasActiveChild = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some(child => isItemActive(child.href));
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80 text-sidebar-primary-foreground">
                  <span className="text-white font-bold text-sm">VK</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">VibeKraft</span>
                  <span className="truncate text-xs">WebVM Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarInput placeholder="Search..." />
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = isItemActive(item.href);
                const hasChildren = item.children && item.children.length > 0;
                const hasActiveChildren = hasActiveChild(item.children);

                if (hasChildren) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={hasActiveChildren}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isActive || hasActiveChildren}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                            {item.badge && (
                              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                            )}
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isItemActive(subItem.href)}
                                >
                                  <Link href={subItem.href || "#"}>
                                    <subItem.icon />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Link href={item.href || "#"}>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.badge && (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupAction title="Add Organization">
            <Plus />
            <span className="sr-only">Add Organization</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isItemActive(item.href)}
                  >
                    <Link href={item.href || "#"}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <StatusIndicator className="px-2 py-1" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
