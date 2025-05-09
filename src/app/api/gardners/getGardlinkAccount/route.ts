// filepath: e:\\Users\\PaulC\\Source\\repos\\PaulCutcliffe\\openai-realtime-agents\\src\\app\\api\\gardners\\getGardlinkAccount\\route.ts
import { NextResponse } from 'next/server';
import sql from 'mssql';

export async function GET() {
  console.log("[API /api/gardners/getGardlinkAccount] Received request");
  let pool: sql.ConnectionPool | null = null;
  try {
    // Use a connection string
    const connectionString = 'Server=localhost\\\\SQLExpress;Database=Gardlink4;User ID=sa;Password=Gardlink2023;TrustServerCertificate=true';
    pool = await sql.connect(connectionString);
    
    console.log("[API /api/gardners/getGardlinkAccount] Connected to DB");

    const result = await pool.request()
      .query`SELECT TOP 1 [GardnersAccountCode] FROM [Gardlink4].[Gardlink].[SupplierDetail] WHERE [SupplierAccountNumber] = 1 AND [DateDeleted] IS NULL ORDER BY [SupplierDetailID] DESC`;
    
    console.log("[API /api/gardners/getGardlinkAccount] Query executed");

    if (result.recordset && result.recordset.length > 0) {
      const accountNumber = result.recordset[0].GardnersAccountCode;
      console.log(`[API /api/gardners/getGardlinkAccount] Account number found: ${accountNumber}`);
      return NextResponse.json({ accountNumber });
    } else {
      console.log("[API /api/gardners/getGardlinkAccount] No account number found");
      return NextResponse.json({ error: "No Gardners account number found in the local Gardlink database." }, { status: 404 });
    }
  } catch (err: any) {
    console.error("[API /api/gardners/getGardlinkAccount] Error:", err);
    return NextResponse.json({ error: "Failed to retrieve account number due to a server error.", details: err.message }, { status: 500 });
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log("[API /api/gardners/getGardlinkAccount] Database connection closed");
      } catch (closeErr) {
        console.error("[API /api/gardners/getGardlinkAccount] Error closing database connection:", closeErr);
      }
    }
  }
}
