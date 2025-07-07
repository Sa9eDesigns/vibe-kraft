"use client";

import { DashboardHeader } from "./header";
import { DashboardNav } from "./dashboard-nav";
import { DashboardSidebar } from "./sidebar";
import { useSidebarStore } from "@/lib/store/use-sidebar-store";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { collapsed } = useSidebarStore();

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className={`flex-1 ${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
