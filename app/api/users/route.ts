import { GET as usersGet } from "../../users/route";

export const runtime = "nodejs";

export async function GET() {
  return usersGet();
}

