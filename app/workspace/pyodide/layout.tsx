import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PyodideWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}
