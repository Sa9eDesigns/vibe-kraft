import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function ManagementPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // For now, we'll use a default organization ID
  // In a real app, you'd get this from the user's current organization
  const organizationId = "default-org-id";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Management Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your projects, workspaces, and WebVM instances.
        </p>
      </div>

      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardOverview organizationId={organizationId} />
      </Suspense>
    </div>
  );
}
