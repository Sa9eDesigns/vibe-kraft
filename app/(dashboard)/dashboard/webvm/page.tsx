import { Metadata } from "next";
import { auth } from "@/auth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WebVMDemo } from "@/components/webvm/demo/webvm-demo";

export const metadata: Metadata = {
  title: "WebVM Development Environment",
  description: "AI-powered development sandbox with CheerpX WebVM",
};

export default async function WebVMPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <WebVMDemo />
  );
}