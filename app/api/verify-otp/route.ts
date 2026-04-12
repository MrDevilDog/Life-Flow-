import { POST as verifyOtpPost } from "../../verify-otp/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return verifyOtpPost(req);
}
