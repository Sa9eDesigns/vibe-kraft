import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CheerpXDirectLoader } from "@/components/workspace/cheerpx-direct-loader";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <>
      <CheerpXDirectLoader />
      <div className="h-screen w-screen overflow-hidden bg-background">
        {children}
      </div>
    </>
  );
}
