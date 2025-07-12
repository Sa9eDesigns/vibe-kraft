import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardLayout as Layout } from "@/components/dashboard/layout/dashboard-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <Layout user={session.user}>
      {children}
    </Layout>
  );
}