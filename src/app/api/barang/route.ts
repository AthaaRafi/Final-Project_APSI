import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { createBarangSchema, listBarangSchema } from "@/lib/validation/barang";
import { createBarangEntry, getBarangList } from "@/server/services/barang.service";
import { getUserScopeRuanganIds } from "@/server/repositories/user-management.repo";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = request.nextUrl;

    const parsed = listBarangSchema.safeParse({
      page: searchParams.get("page") ?? "0",
      size: searchParams.get("size") ?? "20",
      search: searchParams.get("search") ?? undefined,
      jenisId: searchParams.get("jenisId") ?? undefined,
      kondisi: searchParams.get("kondisi") ?? undefined,
      statusBarang: searchParams.get("statusBarang") ?? undefined,
      ruanganId: searchParams.get("ruanganId") ?? undefined,
      penangananKhusus: searchParams.get("penangananKhusus") ?? undefined,
    });

    if (!parsed.success) {
      throw ApiError.badRequest("Parameter tidak valid");
    }

    let scopeRuanganIds: string[] | undefined;
    if (session.role === "PJ_RUANG" || session.role === "LABORAN") {
      scopeRuanganIds = await getUserScopeRuanganIds(session.sub);
    }

    const { data, total } = await getBarangList(parsed.data, scopeRuanganIds);
    return paginated(data, parsed.data.page, parsed.data.size, total);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");

    const formData = await request.formData();

    const body: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "foto") {
        body[key] = value;
      }
    }

    if (typeof body.tahunPembelian === "string") {
      body.tahunPembelian = Number(body.tahunPembelian);
    }

    const parsed = createBarangSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.unprocessable("Validasi gagal", parsed.error.flatten().fieldErrors as Record<string, string>);
    }

    const fotoEntry = formData.get("foto");
    if (!fotoEntry || typeof fotoEntry === "string") {
      throw ApiError.badRequest("Foto wajib diupload");
    }

    const fotoBytes = await fotoEntry.arrayBuffer();
    const fotoFile = {
      buffer: Buffer.from(fotoBytes),
      mimeType: fotoEntry.type,
      size: fotoBytes.byteLength,
    };

    const barang = await createBarangEntry(parsed.data, fotoFile, session.sub);
    return created(barang);
  } catch (error) {
    return toProblemResponse(error);
  }
}
