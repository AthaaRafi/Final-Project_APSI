import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { saveFile, deleteFile } from "@/lib/storage";
import { isAllowedImageType, extensionForMimeType } from "@/lib/storage/validation";
import { getKonfigurasiLabel, upsertKonfigurasiLabel } from "@/server/repositories/label.repo";

export async function GET() {
  try {
    await requireRole("INVENTARIS");
    const config = await getKonfigurasiLabel();
    return ok(config);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole("INVENTARIS");

    const contentType = request.headers.get("content-type") ?? "";

    let ukuranPanjang: number | undefined;
    let ukuranLebar: number | undefined;
    let jumlahPerA4: number | undefined;
    let layoutKolom: number | undefined;
    let logoPath: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      if (formData.get("ukuranPanjang")) ukuranPanjang = Number(formData.get("ukuranPanjang"));
      if (formData.get("ukuranLebar")) ukuranLebar = Number(formData.get("ukuranLebar"));
      if (formData.get("jumlahPerA4")) jumlahPerA4 = Number(formData.get("jumlahPerA4"));
      if (formData.get("layoutKolom")) layoutKolom = Number(formData.get("layoutKolom"));

      const logoEntry = formData.get("logo");
      if (logoEntry && typeof logoEntry !== "string") {
        if (!isAllowedImageType(logoEntry.type)) {
          throw ApiError.badRequest("Format logo tidak didukung (gunakan JPEG, PNG, atau WebP)");
        }
        if (logoEntry.size > 1 * 1024 * 1024) {
          throw ApiError.badRequest("Ukuran logo maksimal 1 MB");
        }

        const existing = await getKonfigurasiLabel();
        if (existing?.logoPath) {
          await deleteFile(existing.logoPath).catch(() => undefined);
        }

        const bytes = await logoEntry.arrayBuffer();
        const ext = extensionForMimeType(logoEntry.type);
        logoPath = await saveFile(Buffer.from(bytes), "logo", ext);
      }
    } else {
      const body = await request.json() as Record<string, unknown>;
      if (body.ukuranPanjang !== undefined) ukuranPanjang = Number(body.ukuranPanjang);
      if (body.ukuranLebar !== undefined) ukuranLebar = Number(body.ukuranLebar);
      if (body.jumlahPerA4 !== undefined) jumlahPerA4 = Number(body.jumlahPerA4);
      if (body.layoutKolom !== undefined) layoutKolom = Number(body.layoutKolom);
    }

    const config = await upsertKonfigurasiLabel({
      ukuranPanjang,
      ukuranLebar,
      jumlahPerA4,
      layoutKolom,
      ...(logoPath && { logoPath }),
    });
    return ok(config);
  } catch (error) {
    return toProblemResponse(error);
  }
}
