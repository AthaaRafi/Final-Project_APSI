import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { toProblemResponse } from "@/lib/api/errors";
import { findBarangById } from "@/server/repositories/barang.repo";
import { getFile } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;

    const barang = await findBarangById(id);
    if (!barang?.fotoPath) {
      return toProblemResponse({ status: 404, title: "Foto tidak ditemukan" });
    }

    const buffer = await getFile(barang.fotoPath);
    const ext = barang.fotoPath.split(".").pop() ?? "jpg";
    const mimeMap: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
    const contentType = mimeMap[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return toProblemResponse(error);
  }
}
