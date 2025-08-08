import { NextResponse } from "next/server";

export async function GET() {
  try {
    const model =
      process.env.OPENAI_REALTIME_MODEL ||
      process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL ||
      "gpt-4o-mini-realtime-preview";
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
        }),
      }
    );
  const data = await response.json();
  // Include the configured model in the response for client display/debug
  return NextResponse.json({ ...data, realtime_model: model });
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
