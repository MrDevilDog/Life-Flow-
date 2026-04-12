import { POST as registerPost } from "../../register/register/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return registerPost(req);
}
