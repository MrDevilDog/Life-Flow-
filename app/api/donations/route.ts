import { GET as donationsGet, POST as donationsPost } from "../../donations/route";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return donationsGet(req);
}

export async function POST(req: Request) {
  return donationsPost(req);
}
