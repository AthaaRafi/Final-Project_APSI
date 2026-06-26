import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { loginSchema } from "@/lib/validation/auth";
import { login } from "@/server/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = loginSchema.parse(body);

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const user = await login(input, ipAddress);

    return ok({
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
    });
  } catch (error) {
    return toProblemResponse(error);
  }
}
