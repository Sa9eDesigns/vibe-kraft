"use client";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
