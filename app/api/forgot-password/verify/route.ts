import { POST as forgotPasswordVerifyPost } from "../../../forgot-password/verify/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return forgotPasswordVerifyPost(req);
}
