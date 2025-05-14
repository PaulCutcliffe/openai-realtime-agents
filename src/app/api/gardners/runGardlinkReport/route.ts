import { NextResponse } from 'next/server';
import sql from 'mssql';
import * as sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Added import for uuid

export const config = {
  maxDuration: 180, // 3 minutes (in seconds)
};

// Helper function to get SQL Server password from SQLite
const getSQLServerPasswordFromSQLite = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const sqliteDbPath = 'C:\\GardlinkSuite\\Data\\Application.db'; // Path to SQLite DB
    const db = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error("[API SQLite - runReport] Error opening database:", err ? err.message : 'Unknown error');
        return reject(`Failed to open SQLite database for password retrieval: ${err ? err.message : 'Unknown error'}`);
      }
      console.log("[API SQLite - runReport] Connected to the SQLite database for password retrieval.");
    });

    const passwordQuery = "SELECT Value FROM Settings WHERE Property = 'GardlinkServerAdminPassword'";
    db.get(passwordQuery, [], (err, row: { Value: string } | undefined) => {
      db.close((closeErr) => {
        if (closeErr) {
          console.error("[API SQLite - runReport] Error closing database:", closeErr ? closeErr.message : 'Unknown error');
        }
      });

      if (err) {
        console.error("[API SQLite - runReport] Error running query:", err.message);
        return reject(`Failed to query SQLite database for password: ${err.message}`);
      }
      if (row && typeof row.Value === 'string') {
        console.log("[API SQLite - runReport] SQL Server password retrieved successfully.");
        resolve(row.Value);
      } else {
        console.log("[API SQLite - runReport] SQL Server password not found for property 'GardlinkServerAdminPassword'.");
        reject("SQL Server password not found in SQLite database (GardlinkServerAdminPassword).");
      }
    });
  });
};

export async function POST(request: Request) {
  console.log("[API /api/gardners/runReport] Received request");
  let sqlServerPassword = '';
  let reportId = '';
  let reportParameters: any = {}; // For future use

  try {
    const body = await request.json();
    reportId = body.reportId;
    reportParameters = body.reportParameters || {}; // For future use

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    console.log(`[API /api/gardners/runReport] Attempting to retrieve SQL Server password from SQLite for report: ${reportId}`);
    sqlServerPassword = await getSQLServerPasswordFromSQLite();
    console.log("[API /api/gardners/runReport] SQL Server password retrieved successfully.");

  } catch (error: any) {
    console.error("[API /api/gardners/runReport] Error processing request body or SQLite password retrieval:", error);
    const errorMessage = error && error.message ? error.message : String(error);
    return NextResponse.json({ error: "Failed to process request or retrieve SQL Server password.", details: errorMessage }, { status: 500 });
  }

  let pool: sql.ConnectionPool | null = null;
  try {
    const reportFilePath = path.join(process.cwd(), 'src', 'app', 'data', 'gardlinkReports', `${reportId}.json`);
    console.log(`[API /api/gardners/runReport] Reading report file: ${reportFilePath}`);
    
    let reportFileContent;
    try {
      reportFileContent = await fs.readFile(reportFilePath, 'utf-8');
    } catch (fileError: any) {
      console.error(`[API /api/gardners/runReport] Error reading report file ${reportId}.json:`, fileError);
      if (fileError.code === 'ENOENT') {
        return NextResponse.json({ error: `Report file ${reportId}.json not found.` }, { status: 404 });
      }
      return NextResponse.json({ error: `Failed to read report file ${reportId}.json.`, details: fileError.message }, { status: 500 });
    }
    
    const report = JSON.parse(reportFileContent);

    if (!report.database) {
        console.error(`[API /api/gardners/runReport] 'database' field missing in report ${reportId}.json`);
        return NextResponse.json({ error: `'database' field missing in report configuration for ${reportId}.` }, { status: 500 });
    }
    if (!report.sqlQuery) {
        console.error(`[API /api/gardners/runReport] 'sqlQuery' field missing in report ${reportId}.json`);
        return NextResponse.json({ error: `'sqlQuery' field missing in report configuration for ${reportId}.` }, { status: 500 });
    }

    const databaseName = report.database; // Gardlink4 or EPOS
    const connectionConfig = {
      user: "sa",
      password: sqlServerPassword,
      server: "localhost\\SQLExpress",
      database: databaseName,
      options: {
        trustServerCertificate: true,
      },
      requestTimeout: 170000 // 170 seconds
    };
    
    console.log(`[API /api/gardners/runReport] Connecting to MSSQL database: ${databaseName} with dynamic password and extended timeout...`);
    pool = await sql.connect(connectionConfig);
    console.log(`[API /api/gardners/runReport] Connected to MSSQL DB: ${databaseName}`);

    // TODO: Implement parameter handling for sqlQuery to prevent SQL injection if report.parameters is used
    const result = await pool.request().query(report.sqlQuery);
    
    console.log("[API /api/gardners/runReport] MSSQL Query executed successfully.");

    // Save full results to a temporary file
    const reportFileId = uuidv4();
    const tempDir = path.join(process.cwd(), 'tmp', 'reports');
    await fs.mkdir(tempDir, { recursive: true }); // Ensure directory exists
    const tempFilePath = path.join(tempDir, `${reportFileId}.json`);
    await fs.writeFile(tempFilePath, JSON.stringify(result.recordset));
    console.log(`[API /api/gardners/runReport] Full report data saved to ${tempFilePath}`);

    // Return a subset of data for immediate display and the file ID
    const summaryData = result.recordset.slice(0, 5); // First 5 records for summary
    return NextResponse.json({ 
      summary: {
        count: result.recordset.length,
        data: summaryData,
      },
      reportFileId: reportFileId // Added reportFileId to the response
    });

  } catch (error: any) {
    console.error("[API /api/gardners/runReport] Error executing report or MSSQL operation:", error);
    const errorMessage = error && error.message ? error.message : String(error);
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Failed to parse report JSON file.", details: errorMessage }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to execute report.", details: errorMessage }, { status: 500 });
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log("[API /api/gardners/runReport] MSSQL Database connection closed");
      } catch (closeErr: any) {
        console.error("[API /api/gardners/runReport] Error closing MSSQL database connection:", closeErr && closeErr.message ? closeErr.message : String(closeErr));
      }
    }
  }
}
