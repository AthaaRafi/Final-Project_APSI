import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { clearSession } from "@/lib/auth/session";

export async function POST() {
  try {
    await clearSession();
    return ok({ success: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
