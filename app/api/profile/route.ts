import { GET as profileGet, PUT as profilePut } from "../../profile/route";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return profileGet(req);
}

export async function PUT(req: Request) {
  return profilePut(req);
}
