import { GET as requestsGet } from "../../requests/route";

export const runtime = "nodejs";

export async function GET() {
  return requestsGet();
}

