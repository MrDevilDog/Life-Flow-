import { GET as authValidateGet } from "../../../auth/validate/route";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return authValidateGet(req);
}
