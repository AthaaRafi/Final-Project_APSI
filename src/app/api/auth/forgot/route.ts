import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { forgotPassword } from "@/server/services/auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = forgotPasswordSchema.parse(body);

    await forgotPassword(input);

    return ok({ success: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
