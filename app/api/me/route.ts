import { GET as meGet } from "../../me/route";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return meGet(req);
}
