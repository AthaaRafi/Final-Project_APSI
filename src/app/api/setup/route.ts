import { ok, created } from "@/lib/api/response";
import { toProblemResponse } from "@/lib/api/errors";
import { setupSchema } from "@/lib/validation/auth";
import { setupFirstInventaris } from "@/server/services/auth.service";
import { countUsers } from "@/server/repositories/auth.repo";

export async function GET() {
  try {
    const userCount = await countUsers();
    return ok({ available: userCount === 0 });
  } catch (error) {
    return toProblemResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = setupSchema.parse(body);

    const user = await setupFirstInventaris(input);

    return created({ id: user.id, email: user.email, nama: user.nama, role: user.role });
  } catch (error) {
    return toProblemResponse(error);
  }
}
