import { AppShell } from "@/components/layout/app-shell";
import { requireAuth } from "@/lib/auth/rbac";
import { findUserById } from "@/server/repositories/auth.repo";

export default async function SharedNotifLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const user = await findUserById(session.sub);

  return (
    <AppShell role={session.role} nama={user?.nama ?? ""}>
      {children}
    </AppShell>
  );
}
