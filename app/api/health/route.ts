import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "kapruka-shopping-agent",
    timestamp: new Date().toISOString(),
  });
}