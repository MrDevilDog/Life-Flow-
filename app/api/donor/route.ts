import { GET as donorGet, POST as donorPost } from "../../donor/donor/route";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return donorGet(req);
}

export async function POST(req: Request) {
  return donorPost(req);
}
