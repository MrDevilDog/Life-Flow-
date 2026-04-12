import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { handleRouteError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("🚀 Starting requests fetch...");
    
    // Test basic database connection first
    try {
      const testResult = await db.query<any[]>("SELECT 1 as test");
      console.log("✅ Database connection OK:", testResult);
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : "Unknown DB error"
      }, { status: 500 });
    }
    
    // Check if requests table exists
    try {
      const tableCheck = await db.query<any[]>(
        "SHOW TABLES LIKE 'requests'"
      );
      console.log("📋 Table check result:", tableCheck);
      
      if (tableCheck.length === 0) {
        console.log("❌ Requests table does not exist");
        return NextResponse.json({ 
          success: true, 
          data: [],
          message: "No requests table found" 
        }, { status: 200 });
      }
    } catch (tableError) {
      console.error("❌ Table check failed:", tableError);
      return NextResponse.json({
        success: false,
        error: "Failed to check table existence",
        details: tableError instanceof Error ? tableError.message : "Unknown table error"
      }, { status: 500 });
    }
    
    // Try the main query
    try {
      console.log("🔍 Executing main query...");
      const rows = await db.query<any[]>(
        `SELECT 
          r.*,
          u.role,
          u.name as requester_name,
          u.email as requester_email,
          u.phone as requester_phone
         FROM requests r
         LEFT JOIN users u ON r.user_id = u.id
         ORDER BY r.created_at DESC`
      );
      console.log(`✅ Successfully fetched ${rows.length} requests`);
      console.log("📝 Sample data:", rows.slice(0, 2));
      
      // Return proper response format
      return NextResponse.json({ 
        success: true, 
        data: rows 
      }, { status: 200 });
      
    } catch (queryError) {
      console.error("❌ Main query failed:", queryError);
      
      // Fallback: try simple query without JOIN
      try {
        console.log("🔄 Trying fallback query...");
        const simpleRows = await db.query<any[]>(
          "SELECT * FROM requests ORDER BY created_at DESC"
        );
        console.log(`✅ Fallback query fetched ${simpleRows.length} requests`);
        
        return NextResponse.json({ 
          success: true, 
          data: simpleRows 
        }, { status: 200 });
        
      } catch (fallbackError) {
        console.error("❌ Fallback query also failed:", fallbackError);
        return NextResponse.json({
          success: false,
          error: "Both main and fallback queries failed",
          mainError: queryError instanceof Error ? queryError.message : "Unknown main error",
          fallbackError: fallbackError instanceof Error ? fallbackError.message : "Unknown fallback error"
        }, { status: 500 });
      }
    }
    
  } catch (error) {
    console.error("💥 REQUEST FETCH ERROR:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
