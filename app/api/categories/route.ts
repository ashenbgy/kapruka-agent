import { NextResponse } from "next/server";
import { listCategories } from "@/lib/kapruka-tools";
import { parseCategories } from "@/lib/parsers/categories";

export async function GET() {
  try {
    const rawResult = await listCategories(1);
    const result = parseCategories(rawResult);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Category lookup failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Kapruka categories.",
      },
      {
        status: 502,
      },
    );
  }
}