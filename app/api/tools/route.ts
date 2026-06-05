import { NextResponse } from "next/server";
import { listKaprukaTools } from "@/lib/kapruka-mcp";

export async function GET() {
  try {
    const tools = await listKaprukaTools();

    return NextResponse.json({
      ok: true,
      tools,
    });
  } catch (error) {
    console.error("Failed to list Kapruka tools:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to connect to the Kapruka MCP server.",
      },
      { status: 502 },
    );
  }
}