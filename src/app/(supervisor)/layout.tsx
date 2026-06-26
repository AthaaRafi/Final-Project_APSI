import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/rbac";
import { findUserById } from "@/server/repositories/auth.repo";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("PIMPINAN");
  const user = await findUserById(session.sub);

  return (
    <AppShell role={session.role} nama={user?.nama ?? ""}>
      {children}
    </AppShell>
  );
}
