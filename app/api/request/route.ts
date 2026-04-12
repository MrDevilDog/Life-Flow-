import { POST as requestPost, GET as requestGet } from "../../request/request/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return requestPost(req);
}

export async function GET(req: Request) {
  return requestGet(req);
}
