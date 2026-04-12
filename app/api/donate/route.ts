import { GET as donateGet, POST as donatePost } from "../../donate/route";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return donateGet(req);
}

export async function POST(req: Request) {
  return donatePost(req);
}
