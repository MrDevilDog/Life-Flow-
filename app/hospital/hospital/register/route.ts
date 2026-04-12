import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";
import { jsonError, handleRouteError } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const hospitalRegisterSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8).max(255),
  location: z.string().min(2).max(255),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, location } = hospitalRegisterSchema.parse(body);

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      "INSERT INTO hospitals (name, email, password, location) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, location]
    );

    const insertId = (result as any)?.insertId;
    return NextResponse.json(
      {
        hospital: {
          id: insertId,
          name,
          email,
          location,
          role: "hospital",
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const maybe = err as { code?: string };
    if (maybe?.code === "ER_DUP_ENTRY") {
      return jsonError(409, "Email already registered for hospital");
    }
    return handleRouteError(err);
  }
}
