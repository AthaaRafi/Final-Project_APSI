import { ok } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { resetPassword } from "@/server/services/auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = resetPasswordSchema.parse(body);

    await resetPassword(input);

    return ok({ success: true });
  } catch (error) {
    return toProblemResponse(error);
  }
}
