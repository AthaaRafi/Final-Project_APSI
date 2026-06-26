import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { ok, paginated } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import {
  listNotifikasiUser,
  countUnreadNotifikasi,
  markAllNotifikasiRead,
} from "@/server/repositories/dashboard.repo";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;
    const page = Number(searchParams.get("page") ?? "0");
    const size = Math.min(Number(searchParams.get("size") ?? "20"), 50);
    const onlyCount = searchParams.get("count") === "true";

    if (onlyCount) {
      const unread = await countUnreadNotifikasi(session.sub);
      return ok({ unread });
    }

    const [data, total] = await listNotifikasiUser(session.sub, page, size);
    return paginated(data, page, size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}

// PATCH /api/notifikasi — tandai semua dibaca
export async function PATCH() {
  try {
    const session = await requireAuth();
    await markAllNotifikasiRead(session.sub);
    return ok({ ok: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
