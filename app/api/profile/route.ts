/**
 * User Profile API Route
 * Handles user profile updates including donor information
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { jsonError, handleRouteError } from "@/lib/http";
import { profileUpdateSchema } from "@/lib/validators";
import { requireAuthUser } from "@/services/auth";
import { z } from "zod";
import { geocodeCity } from "@/lib/geocoding";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    console.log("=== GET USER PROFILE API ===");
    
    // Get authenticated user from request
    const authUser = await requireAuthUser(req);
    console.log("Authenticated user:", authUser.id);

    // Query user and donor information
    const userRows = await db.query<any[]>(
      `SELECT u.id, u.name, u.email, u.phone, u.email_verified, u.phone_verified, u.verification_type, u.created_at,
              d.blood_group, d.location, d.availability, d.lat, d.lng
       FROM users u
       LEFT JOIN donors d ON u.id = d.user_id
       WHERE u.id = ? LIMIT 1`,
      [authUser.id]
    );

    const user = userRows[0];
    if (!user) {
      console.log("User not found");
      return jsonError(404, "User not found");
    }

    console.log("User profile found:", {
      id: user.id,
      name: user.name,
      email: user.email
    });

    // Return user profile data
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      verification_type: user.verification_type,
      created_at: user.created_at,
      blood_group: user.blood_group,
      location: user.location,
      availability: user.availability ? Boolean(user.availability) : null,
      lat: user.lat,
      lng: user.lng
    };

    console.log("Returning user profile:", userProfile);

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (err: unknown) {
    console.error("Get user profile error:", err);
    
    // Return a user-friendly error response
    return handleRouteError(err);
  }
}

export async function PUT(req: Request) {
  try {
    console.log("=== UPDATE USER PROFILE API ===");
    
    // Get authenticated user from request
    const authUser = await requireAuthUser(req);
    console.log("Authenticated user:", authUser.id);

    // Parse and validate request body
    const body = await req.json();
    console.log("Profile update request body:", body);
    
    // Extract email from body before validation
    const { email: userEmail } = body;
    
    // Validate input using schema
    const validatedData = profileUpdateSchema.parse(body);
    const { name, phone, blood_group, location, availability, lat, lng } = validatedData;

    // Update user information
    let userUpdateFields: string[] = [];
    let userUpdateValues: any[] = [];

    if (name !== undefined) {
      userUpdateFields.push("name = ?");
      userUpdateValues.push(name);
    }
    
    if (userEmail !== undefined) {
      userUpdateFields.push("email = ?");
      userUpdateValues.push(userEmail.toLowerCase()); // Store email in lowercase
    }
    
    if (phone !== undefined) {
      userUpdateFields.push("phone = ?");
      userUpdateValues.push(phone);
    }

    // Build and execute user update query
    if (userUpdateFields.length > 0) {
      const userUpdateQuery = `UPDATE users SET ${userUpdateFields.join(", ")} WHERE id = ?`;
      userUpdateValues.push(authUser.id);
      
      console.log("Updating user:", userUpdateQuery, userUpdateValues);
      await db.query(userUpdateQuery, userUpdateValues);
    }

    // Check if donor record exists for this user
    const existingDonor = await db.query<any[]>(
      "SELECT id FROM donors WHERE user_id = ? LIMIT 1",
      [authUser.id]
    );

    const hasDonorRecord = existingDonor.length > 0;

    // Update or create donor record
    if (blood_group !== undefined || location !== undefined || availability !== undefined || lat !== undefined || lng !== undefined) {
      
      // Geocode location if it's being updated and coordinates aren't provided
      let geocodedLat = lat;
      let geocodedLng = lng;
      
      if (location !== undefined && location !== 'Unknown' && (lat === undefined || lng === undefined)) {
        try {
          console.log("Geocoding updated location:", location);
          const coords = await geocodeCity(location);
          if (coords) {
            geocodedLat = coords.lat;
            geocodedLng = coords.lng;
            console.log("Geocoded coordinates:", { lat: geocodedLat, lng: geocodedLng });
          } else {
            console.log("Geocoding failed, using default coordinates");
          }
        } catch (geocodeErr) {
          console.error("Geocoding error:", geocodeErr);
        }
      }
      
      if (hasDonorRecord) {
        // Update existing donor record
        const donorUpdateFields: string[] = [];
        const donorUpdateValues: any[] = [];

        if (blood_group !== undefined) {
          donorUpdateFields.push("blood_group = ?");
          donorUpdateValues.push(blood_group);
        }

        if (location !== undefined) {
          donorUpdateFields.push("location = ?");
          donorUpdateValues.push(location);
        }

        if (availability !== undefined) {
          donorUpdateFields.push("availability = ?");
          donorUpdateValues.push(availability ? 1 : 0);
        }

        if (geocodedLat !== undefined) {
          donorUpdateFields.push("lat = ?");
          donorUpdateValues.push(geocodedLat);
        }

        if (geocodedLng !== undefined) {
          donorUpdateFields.push("lng = ?");
          donorUpdateValues.push(geocodedLng);
        }

        if (donorUpdateFields.length > 0) {
          const donorUpdateQuery = `UPDATE donors SET ${donorUpdateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
          donorUpdateValues.push(authUser.id);
          
          console.log("Updating donor record:", donorUpdateQuery, donorUpdateValues);
          await db.query(donorUpdateQuery, donorUpdateValues);
        }
      } else {
        // Create new donor record
        const donorBloodGroup = blood_group || 'O+';
        const donorLocation = location || 'Unknown';
        
        await db.query(
          "INSERT INTO donors (user_id, blood_group, location, phone, availability, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [authUser.id, donorBloodGroup, donorLocation, phone || '', availability !== undefined ? (availability ? 1 : 0) : 1, geocodedLat || 0, geocodedLng || 0]
        );
        
        console.log("Donor record created for user:", authUser.id);
      }
    }

    // Fetch and return updated user data
    const updatedUserRows = await db.query<any[]>(
      `SELECT u.id, u.name, u.email, u.phone, u.email_verified, u.phone_verified, u.verification_type, u.created_at,
              d.blood_group, d.location, d.availability, d.lat, d.lng
       FROM users u
       LEFT JOIN donors d ON u.id = d.user_id
       WHERE u.id = ? LIMIT 1`,
      [authUser.id]
    );

    const updatedUser = updatedUserRows[0];
    if (!updatedUser) {
      console.log("Updated user not found");
      return jsonError(404, "User not found");
    }

    // Return complete updated user profile data
    const updatedUserProfile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      email_verified: updatedUser.email_verified,
      phone_verified: updatedUser.phone_verified,
      verification_type: updatedUser.verification_type,
      created_at: updatedUser.created_at,
      blood_group: updatedUser.blood_group,
      location: updatedUser.location,
      availability: updatedUser.availability ? Boolean(updatedUser.availability) : null,
      lat: updatedUser.lat,
      lng: updatedUser.lng
    };

    console.log("Returning updated user profile:", updatedUserProfile);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUserProfile
    });

  } catch (err: unknown) {
    console.error("Update user profile error:", err);
    
    // Return a user-friendly error response
    return handleRouteError(err);
  }
}
