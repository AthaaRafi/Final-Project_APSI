import { paginated } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { requireRole } from "@/lib/auth/rbac";
import { getUserList } from "@/server/services/user-management.service";

export async function GET(req: Request) {
  try {
    await requireRole("INVENTARIS");

    const url = new URL(req.url);
    const page = Math.max(0, Number(url.searchParams.get("page") ?? 0));
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get("size") ?? 20)));

    const { data, total } = await getUserList(page, size);
    return paginated(data, page, size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}
