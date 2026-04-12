import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { handleRouteError } from "@/lib/http";
import { getAuthUser, requireAuthUser } from "@/services/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    console.log("🔍 Fetching donors from DB...");
    
    // Check if user is authenticated - handle gracefully if auth fails
    let user = null;
    let isAuthenticated = false;
    
    try {
      user = await getAuthUser(req);
      isAuthenticated = !!user;
    } catch (authError) {
      console.log("⚠️ Auth check failed, proceeding as guest:", authError);
      isAuthenticated = false;
    }
    
    console.log(`👤 User authenticated: ${isAuthenticated ? user?.email : 'Guest'}`);

    // Build query based on authentication status and available columns
    let query;
    
    // Check if city and district columns exist (from migration)
    const hasCityDistrict = await checkColumnsExist(['city', 'district']);
    
    if (isAuthenticated) {
      // Authenticated users get full data
      if (hasCityDistrict) {
        query = `
          SELECT 
            d.id, 
            u.name, 
            d.blood_group, 
            d.location,
            d.city,
            d.district,
            d.phone, 
            d.availability,
            d.lat,
            d.lng,
            d.created_at
          FROM donors d 
          JOIN users u ON d.user_id = u.id 
          WHERE d.availability = TRUE
          ORDER BY d.created_at DESC
        `;
      } else {
        query = `
          SELECT 
            d.id, 
            u.name, 
            d.blood_group, 
            d.location,
            NULL as city,
            NULL as district,
            d.phone, 
            d.availability,
            d.lat,
            d.lng,
            d.created_at
          FROM donors d 
          JOIN users u ON d.user_id = u.id 
          WHERE d.availability = TRUE
          ORDER BY d.created_at DESC
        `;
      }
    } else {
      // Unauthenticated users get limited data (no sensitive info)
      if (hasCityDistrict) {
        query = `
          SELECT 
            d.id,
            -- Mask name for privacy (show first letter + last name initial)
            CONCAT(LEFT(u.name, 1), '*****', RIGHT(u.name, 1)) as masked_name,
            d.blood_group, 
            d.location,
            d.city,
            d.district,
            d.availability,
            d.created_at
          FROM donors d 
          JOIN users u ON d.user_id = u.id 
          WHERE d.availability = TRUE
          ORDER BY d.created_at DESC
        `;
      } else {
        query = `
          SELECT 
            d.id,
            -- Mask name for privacy (show first letter + last name initial)
            CONCAT(LEFT(u.name, 1), '*****', RIGHT(u.name, 1)) as masked_name,
            d.blood_group, 
            d.location,
            NULL as city,
            NULL as district,
            d.availability,
            d.created_at
          FROM donors d 
          JOIN users u ON d.user_id = u.id 
          WHERE d.availability = TRUE
          ORDER BY d.created_at DESC
        `;
      }
    }

    const rows = await db.query<any[]>(query);
    console.log(`✅ Fetched ${rows.length} donors for ${isAuthenticated ? 'authenticated' : 'guest'} user`);

    // Transform data safely
    const transformedRows = rows.map(donor => {
      if (isAuthenticated) {
        // Return full data for authenticated users
        return {
          id: donor.id,
          name: donor.name || "Unknown",
          blood_group: donor.blood_group || null,
          location: donor.location || null,
          city: donor.city || null,
          district: donor.district || null,
          phone: donor.phone || null,
          availability: Boolean(donor.availability),
          lat: donor.lat ? parseFloat(donor.lat) : null,
          lng: donor.lng ? parseFloat(donor.lng) : null,
          created_at: donor.created_at
        };
      } else {
        // Return limited data for guests
        return {
          id: donor.id,
          name: donor.masked_name || "*****",
          blood_group: donor.blood_group || null,
          location: donor.location || null,
          city: donor.city || null,
          district: donor.district || null,
          availability: Boolean(donor.availability),
          // No phone, no coordinates for guests
          created_at: donor.created_at
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: transformedRows,
      count: transformedRows.length,
      authenticated: isAuthenticated,
      message: isAuthenticated 
        ? "Full donor data retrieved" 
        : "Limited donor data available. Login to see contact information."
    });

  } catch (err: unknown) {
    console.error("❌ Donors API error:", err);
    
    // Return specific error information for debugging
    if (err instanceof Error) {
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
    
    return handleRouteError(err);
  }
}

// Helper function to check if columns exist
async function checkColumnsExist(columns: string[]): Promise<boolean> {
  try {
    // Check if columns exist in donors table
    const result = await db.query<any[]>(
      `SHOW COLUMNS FROM donors WHERE Field IN (${columns.map(() => '?').join(',')})`,
      columns
    );
    return result.length === columns.length;
  } catch (error) {
    console.log("⚠️ Could not check column existence, assuming columns don't exist:", error);
    return false;
  }
}
