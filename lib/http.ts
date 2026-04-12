import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(
  status: number,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function handleRouteError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError(400, "Invalid request", err.flatten());
  }

  const maybe = err as { status?: number; message?: string };
  if (maybe?.status && maybe?.message) {
    return jsonError(maybe.status, maybe.message);
  }

  if (err instanceof Error && err.message) {
    console.error("❌ Route error:", err.message);
    return jsonError(500, err.message);
  }

  console.error(err);
  return jsonError(500, "Internal server error");
}

