import { NextResponse } from "next/server";
import { initializeLongTermMemory } from "@/lib/ai/qdrant-memory";

export async function GET() {
    try {
        await initializeLongTermMemory();
        return NextResponse.json({ ok: true, message: "Qdrant memory initialized successfully from catalog.json!" });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
