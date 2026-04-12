import { GET as requestByIdGet } from "../../../requests/[id]/route";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return requestByIdGet(req, context);
}
