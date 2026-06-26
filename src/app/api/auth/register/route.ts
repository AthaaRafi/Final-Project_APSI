import { created } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { registerSchema } from "@/lib/validation/auth";
import { register } from "@/server/services/auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);

    const user = await register(input);

    return created({ id: user.id, email: user.email, nama: user.nama });
  } catch (error) {
    return toProblemResponse(error);
  }
}
