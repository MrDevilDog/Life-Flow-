import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocoding";
import { z } from "zod";

export const runtime = "nodejs";

// Validation schema for reverse geocoding request
const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  lng: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
});

export async function POST(req: Request) {
  try {
    console.log("🔍 Reverse geocoding request");
    
    const body = await req.json();
    console.log("📝 Request body:", body);
    
    // Validate request body
    let parsed;
    try {
      parsed = reverseGeocodeSchema.parse(body);
    } catch (validationErr) {
      console.error("❌ Validation error:", validationErr);
      if (validationErr instanceof z.ZodError) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid coordinates",
            details: validationErr.errors.map(e => e.message).join(", ")
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }

    const { lat, lng } = parsed;
    console.log(`📍 Processing coordinates: ${lat}, ${lng}`);

    // Perform reverse geocoding
    const locationData = await reverseGeocode(lat, lng);
    
    if (!locationData) {
      console.log("❌ No location data found");
      return NextResponse.json(
        { 
          success: false, 
          error: "Unable to find location data for the provided coordinates" 
        },
        { status: 404 }
      );
    }

    console.log("✅ Reverse geocoding successful");
    return NextResponse.json({
      success: true,
      data: locationData,
      message: "Location data retrieved successfully"
    });

  } catch (error) {
    console.error("❌ Reverse geocoding error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error during geocoding" 
      },
      { status: 500 }
    );
  }
}

// Optional: Support GET requests for testing
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Valid lat and lng parameters are required" 
        },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid coordinate range" 
        },
        { status: 400 }
      );
    }

    console.log(`📍 GET request - Processing coordinates: ${lat}, ${lng}`);

    // Perform reverse geocoding
    const locationData = await reverseGeocode(lat, lng);
    
    if (!locationData) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Unable to find location data for the provided coordinates" 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: locationData,
      message: "Location data retrieved successfully"
    });

  } catch (error) {
    console.error("❌ GET reverse geocoding error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error during geocoding" 
      },
      { status: 500 }
    );
  }
}
