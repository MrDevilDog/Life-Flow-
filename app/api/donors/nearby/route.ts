import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { handleRouteError } from "@/lib/http";
import { calculateDistance } from "@/lib/geocoding";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const radius = url.searchParams.get("radius") || "50"; // Default 50km
    const bloodGroup = url.searchParams.get("blood_group");

    // Validate input parameters
    if (!lat || !lng) {
      return NextResponse.json(
        { 
          success: false,
          error: "Latitude and longitude are required" 
        },
        { status: 400 }
      );
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const maxDistance = parseFloat(radius);

    // Validate numeric values
    if (isNaN(userLat) || isNaN(userLng) || isNaN(maxDistance)) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid numeric values for coordinates or radius" 
        },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
      return NextResponse.json(
        { 
          success: false,
          error: "Coordinates out of valid range. Latitude: -90 to 90, Longitude: -180 to 180" 
        },
        { status: 400 }
      );
    }

    if (maxDistance < 0 || maxDistance > 1000) {
      return NextResponse.json(
        { 
          success: false,
          error: "Radius must be between 0 and 1000 km" 
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching nearby donors: lat=${userLat}, lng=${userLng}, radius=${maxDistance}km`);

    // Get all available donors with coordinates
    let query = `
      SELECT 
        d.id,
        d.blood_group,
        d.location,
        d.phone,
        d.lat,
        d.lng,
        d.availability,
        u.name,
        u.email
       FROM donors d
       JOIN users u ON d.user_id = u.id
       WHERE d.availability = TRUE 
       AND d.lat IS NOT NULL 
       AND d.lng IS NOT NULL`;

    let queryParams: any[] = [];

    // Add blood group filter if provided
    if (bloodGroup) {
      query += " AND d.blood_group = ?";
      queryParams.push(bloodGroup);
    }

    console.log("📋 Executing query:", query, queryParams);

    const rows = await db.query<any[]>(query);
    console.log(`✅ Found ${rows.length} donors with valid coordinates`);

    // Filter by distance safely
    const nearbyDonors = rows
      .filter(donor => {
        try {
          // Ensure lat/lng are valid numbers
          const donorLat = parseFloat(donor.lat);
          const donorLng = parseFloat(donor.lng);
          
          if (isNaN(donorLat) || isNaN(donorLng)) {
            console.log(`⚠️ Skipping donor ${donor.id} - invalid coordinates`);
            return false;
          }

          const distance = calculateDistance(userLat, userLng, donorLat, donorLng);
          return distance <= maxDistance;
        } catch (error) {
          console.log(`⚠️ Error calculating distance for donor ${donor.id}:`, error);
          return false;
        }
      })
      .map(donor => {
        try {
          const donorLat = parseFloat(donor.lat);
          const donorLng = parseFloat(donor.lng);
          const distance = calculateDistance(userLat, userLng, donorLat, donorLng);
          
          return {
            id: donor.id,
            name: donor.name || "Unknown",
            blood_group: donor.blood_group || null,
            location: donor.location || null,
            phone: donor.phone || null,
            availability: Boolean(donor.availability),
            lat: donorLat,
            lng: donorLng,
            distance: Math.round(distance * 10) / 10 // Round to 1 decimal
          };
        } catch (error) {
          console.log(`⚠️ Error processing donor ${donor.id}:`, error);
          return null;
        }
      })
      .filter(donor => donor !== null) // Remove any null entries from processing errors
      .sort((a, b) => a.distance - b.distance);

    console.log(`📍 Found ${nearbyDonors.length} donors within ${maxDistance}km`);

    return NextResponse.json({
      success: true,
      data: nearbyDonors,
      count: nearbyDonors.length,
      search_params: {
        lat: userLat,
        lng: userLng,
        radius: maxDistance,
        blood_group: bloodGroup || null
      }
    });

  } catch (err: unknown) {
    console.error("❌ Nearby donors API error:", err);
    
    // Return specific error information for debugging
    if (err instanceof Error) {
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
    
    // Return a user-friendly error response
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to search for nearby donors. Please try again later.",
        details: process.env.NODE_ENV === 'development' ? err instanceof Error ? err.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}
