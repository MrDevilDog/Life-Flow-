import { GET as statsGet } from "../../stats/route";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return statsGet(req);
}
