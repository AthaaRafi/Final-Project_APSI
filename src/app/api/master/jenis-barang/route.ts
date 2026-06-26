import { created, paginated } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { createJenisBarangSchema } from "@/lib/validation/jenis-barang";
import { requireRole } from "@/lib/auth/rbac";
import { createJenisBarangEntry, getJenisBarangList } from "@/server/services/jenis-barang.service";

export async function GET(req: Request) {
  try {
    await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");

    const url = new URL(req.url);
    const page = Math.max(0, Number(url.searchParams.get("page") ?? 0));
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get("size") ?? 20)));

    const { data, total } = await getJenisBarangList(page, size);
    return paginated(data, page, size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole("INVENTARIS");

    const body = await req.json();
    const input = createJenisBarangSchema.parse(body);

    const jenisBarang = await createJenisBarangEntry(input, session.sub);
    return created(jenisBarang);
  } catch (error) {
    return toProblemResponse(error);
  }
}
