import { created, paginated } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { createKategoriApprovalSchema } from "@/lib/validation/kategori-approval";
import { requireRole } from "@/lib/auth/rbac";
import { createKategoriApprovalEntry, getKategoriApprovalList } from "@/server/services/kategori-approval.service";

export async function GET(req: Request) {
  try {
    await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");

    const url = new URL(req.url);
    const page = Math.max(0, Number(url.searchParams.get("page") ?? 0));
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get("size") ?? 20)));

    const { data, total } = await getKategoriApprovalList(page, size);
    return paginated(data, page, size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole("INVENTARIS");

    const body = await req.json();
    const input = createKategoriApprovalSchema.parse(body);

    const kategori = await createKategoriApprovalEntry(input, session.sub);
    return created(kategori);
  } catch (error) {
    return toProblemResponse(error);
  }
}
