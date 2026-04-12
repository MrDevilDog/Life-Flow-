import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { handleRouteError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;
    console.log(`🔍 Fetching request details for ID: ${requestId}`);
    
    const rows = await db.query<any[]>(
      `SELECT 
        r.*,
        u.role,
        u.name as requester_name,
        u.email as requester_email,
        u.phone as requester_phone
       FROM requests r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [requestId]
    );

    const request = rows[0];
    if (!request) {
      console.log(`❌ Request ${requestId} not found`);
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Found request ${requestId}`);
    return NextResponse.json({ 
      success: true, 
      data: request 
    }, { status: 200 });
    
  } catch (error) {
    console.error("💥 Error fetching request:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
