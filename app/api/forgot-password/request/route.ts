import { POST as forgotPasswordRequestPost } from "../../../forgot-password/request/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return forgotPasswordRequestPost(req);
}
