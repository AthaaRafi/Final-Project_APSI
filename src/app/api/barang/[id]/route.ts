import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { updateBarangSchema } from "@/lib/validation/barang";
import {
  deleteBarangEntry,
  getBarangDetail,
  updateBarangEntry,
} from "@/server/services/barang.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const detail = await getBarangDetail(id);
    return ok(detail);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("PJ_RUANG", "LABORAN", "INVENTARIS");
    const { id } = await params;

    const contentType = request.headers.get("content-type") ?? "";
    let fotoFile: { buffer: Buffer; mimeType: string; size: number } | null = null;
    let body: Record<string, unknown> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (key !== "foto") {
          body[key] = value;
        }
      }
      if (typeof body.tahunPembelian === "string") {
        body.tahunPembelian = Number(body.tahunPembelian);
      }
      const fotoEntry = formData.get("foto");
      if (fotoEntry && typeof fotoEntry !== "string") {
        const bytes = await fotoEntry.arrayBuffer();
        fotoFile = { buffer: Buffer.from(bytes), mimeType: fotoEntry.type, size: bytes.byteLength };
      }
    } else {
      body = await request.json();
    }

    const parsed = updateBarangSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.unprocessable("Validasi gagal", parsed.error.flatten().fieldErrors as Record<string, string>);
    }

    const barang = await updateBarangEntry(id, parsed.data, fotoFile, session.sub);
    return ok(barang);
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole("INVENTARIS");
    const { id } = await params;
    await deleteBarangEntry(id, session.sub);
    return ok({ message: "Barang berhasil dinonaktifkan" });
  } catch (error) {
    return toProblemResponse(error);
  }
}
