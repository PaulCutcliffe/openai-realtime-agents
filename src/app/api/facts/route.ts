import { NextRequest, NextResponse } from "next/server";
import { getAllFacts, insertFact } from "@/app/lib/mongo";

export async function GET() {
  try {
    const facts = await getAllFacts();
    return NextResponse.json({ facts });
  } catch (error: any) {
    console.error("Error in GET /api/facts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fact } = await req.json();
    if (!fact) {
      return NextResponse.json({ error: "Missing 'fact' field" }, { status: 400 });
    }
    await insertFact(fact);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error in POST /api/facts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
