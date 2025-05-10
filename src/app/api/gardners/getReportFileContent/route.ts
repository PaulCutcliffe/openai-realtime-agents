// filepath: e:\\Users\\PaulC\\Source\\repos\\PaulCutcliffe\\openai-realtime-agents\\src\\app\\api\\gardners\\getReportFileContent\\route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  if (!fileId) {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  // Validate fileId format (basic validation, improve as needed)
  if (!/^[a-f0-9\\-]+$/.test(fileId)) {
    return NextResponse.json({ error: "Invalid fileId format" }, { status: 400 });
  }

  try {
    const tempFilePath = path.join(process.cwd(), 'tmp', 'reports', `${fileId}.json`);
    
    // Check if file exists
    try {
      await fs.access(tempFilePath);
    } catch (error) {
      console.warn(`[API getReportFileContent] File not found: ${tempFilePath}`);
      return NextResponse.json({ error: "Report file not found or access denied." }, { status: 404 });
    }

    const fileContent = await fs.readFile(tempFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    return NextResponse.json({ data });

  } catch (error: any) {
    console.error("[API getReportFileContent] Error reading or parsing report file:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Failed to parse report file content.", details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to retrieve report file content.", details: error.message }, { status: 500 });
  }
}
