import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { verifyEmailSchema } from "@/lib/validation/auth";
import { verifyEmail } from "@/server/services/auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = verifyEmailSchema.parse(body);

    await verifyEmail(input);

    return ok({ success: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
