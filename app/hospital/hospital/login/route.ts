import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/mysql";
import { handleRouteError } from "@/lib/http";
import { loginSchema } from "@/lib/validators";
import { signToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);
    const email = parsed.emailOrPhone;
    const password = parsed.password;

    const rows = await db.query<any[]>(
      "SELECT id, name, email, password, location FROM hospitals WHERE email = ? LIMIT 1",
      [email]
    );

    const hospital = rows[0];

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: "Hospital not found" },
        { status: 404 }
      );
    }

    const passwordOk = await bcrypt.compare(password, hospital.password);

    if (!passwordOk) {
      return NextResponse.json(
        { success: false, error: "Incorrect password" },
        { status: 401 }
      );
    }

    // 🔥 FIX: ensure correct typing for token payload
    const token = signToken({
      id: Number(hospital.id),
      role: "hospital" as const, // ✅ prevents TS error
    });

    return NextResponse.json(
      {
        success: true,
        token,
        hospital: {
          id: Number(hospital.id),
          name: hospital.name,
          email: hospital.email,
          location: hospital.location ?? null,
          role: "hospital",
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return handleRouteError(err);
  }
}