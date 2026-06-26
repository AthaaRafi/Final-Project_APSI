import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getFile } from "@/lib/storage";
import { ApiError, toProblemResponse } from "@/lib/api/errors";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: segments } = await params;
    const relativePath = segments.join("/");
    const buffer = await getFile(relativePath);
    const contentType = CONTENT_TYPE_BY_EXTENSION[path.extname(relativePath).toLowerCase()] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return toProblemResponse(ApiError.notFound("File tidak ditemukan"));
    }
    return toProblemResponse(error);
  }
}
