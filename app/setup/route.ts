import { NextResponse } from "next/server";
import { db } from "@/lib/mysql";

export async function GET() {
  try {
    await db.query(`
      DO $$
      BEGIN
        CREATE TYPE blood_group_type AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 1. Create hospitals table
    await db.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        location VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create blood_inventory table
    await db.query(`
      CREATE TABLE IF NOT EXISTS blood_inventory (
        id BIGSERIAL PRIMARY KEY,
        hospital_id BIGINT REFERENCES hospitals(id) ON DELETE CASCADE,
        blood_group blood_group_type,
        units INT DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (hospital_id, blood_group)
      );
    `);

    return NextResponse.json({ success: true, message: "Tables created successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
