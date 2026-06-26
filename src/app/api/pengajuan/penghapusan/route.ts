import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/rbac";
import { created } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { createPenghapusanSchema } from "@/lib/validation/pengajuan";
import { createPenghapusanEntry } from "@/server/services/pengajuan.service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN");
    const contentType = request.headers.get("content-type") ?? "";

    let body: Record<string, unknown> = {};
    let fotoFile: { buffer: Buffer; mimeType: string; size: number } | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (key !== "foto") body[key] = value;
      }
      const fotoEntry = formData.get("foto");
      if (fotoEntry && typeof fotoEntry !== "string") {
        const bytes = await fotoEntry.arrayBuffer();
        fotoFile = { buffer: Buffer.from(bytes), mimeType: fotoEntry.type, size: bytes.byteLength };
      }
    } else {
      body = await request.json();
    }

    const parsed = createPenghapusanSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.unprocessable("Validasi gagal", parsed.error.flatten().fieldErrors as Record<string, string>);
    }

    const pengajuan = await createPenghapusanEntry(parsed.data, fotoFile, session.sub, session.role);
    return created(pengajuan);
  } catch (error) {
    return toProblemResponse(error);
  }
}
