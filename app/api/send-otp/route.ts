import { POST as sendOtpPost } from "../../send-otp/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return sendOtpPost(req);
}
