import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/rbac";
import { findUserById } from "@/server/repositories/auth.repo";

export default async function InventarisLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("INVENTARIS");
  const user = await findUserById(session.sub);

  return (
    <AppShell role={session.role} nama={user?.nama ?? ""}>
      {children}
    </AppShell>
  );
}
