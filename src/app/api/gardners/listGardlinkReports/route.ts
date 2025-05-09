// filepath: c:\Users\8675\Source\openai-realtime-agents\src\app\api\gardners\listGardlinkReports\route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  console.log("[API /api/gardners/listGardlinkReports] Received request");
  try {
    const reportsDir = path.join(process.cwd(), 'src', 'app', 'data', 'gardlinkReports');
    console.log(`[API /api/gardners/listGardlinkReports] Reading reports from directory: ${reportsDir}`);
    
    let files;
    try {
      files = await fs.readdir(reportsDir);
    } catch (dirError: any) {
      console.error(`[API /api/gardners/listGardlinkReports] Error reading reports directory ${reportsDir}:`, dirError);
      if (dirError.code === 'ENOENT') {
        return NextResponse.json({ error: "Reports directory not found.", details: `Directory ${reportsDir} does not exist.` }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to read reports directory.", details: dirError.message }, { status: 500 });
    }

    const reportPromises = files
      .filter(file => file.endsWith('.json'))
      .map(async (file) => {
        const filePath = path.join(reportsDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const reportData = JSON.parse(content);
          return {
            id: reportData.id || file.replace('.json', ''),
            title: reportData.title || 'Untitled Report',
            description: reportData.description || 'No description available.'
          };
        } catch (parseError: any) {
          console.error(`[API /api/gardners/listGardlinkReports] Error parsing report file ${file}:`, parseError.message);
          return {
            id: file.replace('.json', ''),
            title: `Error: Could not parse ${file}`,
            description: parseError.message
          };
        }
      });
    const reports = await Promise.all(reportPromises);

    if (reports.length === 0) {
      console.log("[API /api/gardners/listGardlinkReports] No reports found in the directory.");
      return NextResponse.json({ reports: [], message: "No reports found in the directory." });
    }

    console.log(`[API /api/gardners/listGardlinkReports] Successfully found and processed ${reports.length} reports.`);
    return NextResponse.json({ reports });

  } catch (err: any) {
    console.error("[API /api/gardners/listGardlinkReports] General error listing reports:", err);
    return NextResponse.json({ error: "Failed to list Gardlink reports due to an unexpected server error.", details: err.message }, { status: 500 });
  }
}
