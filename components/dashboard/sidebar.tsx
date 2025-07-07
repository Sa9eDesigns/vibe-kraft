"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/store/use-sidebar-store";
import {
  BarChart3,
  CreditCard,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Settings,
  Users,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardSidebar({ className }: SidebarNavProps) {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebarStore();
  const [mounted, setMounted] = useState(false);

  // Handle window resize
  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setCollapsed]);

  if (!mounted) {
    return null;
  }

  const sidebarNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "WebVM",
      href: "/dashboard/webvm",
      icon: <Monitor className="h-5 w-5" />,
    },
    {
      title: "Projects",
      href: "/dashboard/projects",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Team",
      href: "/dashboard/team",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Billing",
      href: "/dashboard/billing",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: "Help",
      href: "/dashboard/help",
      icon: <LifeBuoy className="h-5 w-5" />,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex h-full flex-col border-r bg-background transition-all duration-300 md:relative",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center justify-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          {!collapsed && (
            <span className="font-bold text-xl">VibeKraft</span>
          )}
          {collapsed && <Home className="h-5 w-5" />}
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {sidebarNavItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}