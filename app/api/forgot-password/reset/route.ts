import { POST as forgotPasswordResetPost } from "../../../forgot-password/reset/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return forgotPasswordResetPost(req);
}
