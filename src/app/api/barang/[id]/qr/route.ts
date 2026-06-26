import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { ok } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { findBarangById, findActiveQrForBarang } from "@/server/repositories/barang.repo";
import { generateQrDataUrl } from "@/lib/qr/generate";
import type { QrBarangPayload } from "@/lib/qr/generate";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;

    const barang = await findBarangById(id);
    if (!barang) throw ApiError.notFound("Barang tidak ditemukan");

    const qr = await findActiveQrForBarang(id);
    if (!qr) throw ApiError.notFound("QR Code tidak ditemukan");

    const payload = JSON.parse(qr.payload) as QrBarangPayload;
    const dataUrl = await generateQrDataUrl(payload);

    return ok({ qrId: qr.id, dataUrl, payload });
  } catch (error) {
    return toProblemResponse(error);
  }
}
