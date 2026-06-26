import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { created } from "@/lib/api/response";
import { ApiError, toProblemResponse } from "@/lib/api/errors";
import { createPemindahanSchema } from "@/lib/validation/pengajuan";
import { createPemindahanEntry } from "@/server/services/pengajuan.service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const parsed = createPemindahanSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.unprocessable("Validasi gagal", parsed.error.flatten().fieldErrors as Record<string, string>);
    }

    const result = await createPemindahanEntry(parsed.data, session.sub);
    return created(result);
  } catch (error) {
    return toProblemResponse(error);
  }
}
