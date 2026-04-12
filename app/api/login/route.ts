import { POST as loginPost } from "../../login/login/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return loginPost(req);
}
