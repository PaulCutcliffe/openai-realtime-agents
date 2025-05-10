// filepath: e:\\Users\\PaulC\\Source\\repos\\PaulCutcliffe\\openai-realtime-agents\\src\\app\\api\\gardners\\getGardlinkAccount\\route.ts
import { NextResponse } from 'next/server';
import sql from 'mssql';
import * as sqlite3 from 'sqlite3'; // ADDED: Import sqlite3

export async function GET() {
  console.log("[API /api/gardners/getGardlinkAccount] Received request");

  // ADDED: Helper function to get SQL Server password from SQLite
  const getSQLServerPasswordFromSQLite = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const sqliteDbPath = 'C:\\GardlinkSuite\\Data\\Application.db'; // Path to SQLite DB
      const db = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error("[API SQLite] Error opening database:", err ? err.message : 'Unknown error');
          return reject(`Failed to open SQLite database for password retrieval: ${err ? err.message : 'Unknown error'}`);
        }
        console.log("[API SQLite] Connected to the SQLite database for password retrieval.");
      });

      const passwordQuery = "SELECT Value FROM Settings WHERE Property = 'GardlinkServerAdminPassword'";
      db.get(passwordQuery, [], (err, row: { Value: string } | undefined) => {
        // Ensure DB is closed in all paths within this callback
        db.close((closeErr) => {
          if (closeErr) {
            console.error("[API SQLite] Error closing database:", closeErr ? closeErr.message : 'Unknown error');
            // This error is secondary; primary error/success is handled by reject/resolve
          }
        });

        if (err) {
          console.error("[API SQLite] Error running query:", err.message);
          return reject(`Failed to query SQLite database for password: ${err.message}`);
        }
        if (row && typeof row.Value === 'string') {
          console.log("[API SQLite] SQL Server password retrieved successfully.");
          resolve(row.Value);
        } else {
          console.log("[API SQLite] SQL Server password not found for property 'GardlinkServerAdminPassword'.");
          reject("SQL Server password not found in SQLite database (GardlinkServerAdminPassword).");
        }
      });
    });
  };

  let sqlServerPassword = '';
  try {
    console.log("[API /api/gardners/getGardlinkAccount] Attempting to retrieve SQL Server password from SQLite...");
    sqlServerPassword = await getSQLServerPasswordFromSQLite();
    console.log("[API /api/gardners/getGardlinkAccount] SQL Server password retrieved successfully.");
  } catch (sqliteError: any) {
    console.error("[API /api/gardners/getGardlinkAccount] Error retrieving password from SQLite:", sqliteError);
    const errorMessage = sqliteError && sqliteError.message ? sqliteError.message : String(sqliteError);
    return NextResponse.json({ error: "Failed to retrieve SQL Server password from SQLite.", details: errorMessage }, { status: 500 });
  }

  let pool: sql.ConnectionPool | null = null;
  try {
    // UPDATED: Use a connection string with the retrieved password
    const connectionString = `Server=localhost\\\\SQLExpress;Database=Gardlink4;User ID=sa;Password=${sqlServerPassword};TrustServerCertificate=true`;
    
    console.log("[API /api/gardners/getGardlinkAccount] Connecting to MSSQL with dynamic password...");
    pool = await sql.connect(connectionString);
    console.log("[API /api/gardners/getGardlinkAccount] Connected to MSSQL DB");

    // Query for GardnersAccountCode
    const accountResult = await pool.request()
      .query`SELECT TOP 1 [GardnersAccountCode] FROM [Gardlink4].[Gardlink].[SupplierDetail] WHERE [SupplierAccountNumber] = 1 AND [DateDeleted] IS NULL ORDER BY [SupplierDetailID] DESC`;
    
    console.log("[API /api/gardners/getGardlinkAccount] MSSQL Query for Account Code executed");

    let accountNumber: string | null = null;
    if (accountResult.recordset && accountResult.recordset.length > 0 && accountResult.recordset[0].GardnersAccountCode) {
      accountNumber = accountResult.recordset[0].GardnersAccountCode;
      console.log(`[API /api/gardners/getGardlinkAccount] Account number found: ${accountNumber}`);
    } else {
      console.log("[API /api/gardners/getGardlinkAccount] No account number found in MSSQL");
      // Do not return immediately, we still want to try fetching company details
    }

    // Query for Company Details
    const companyResult = await pool.request()
      .query`SELECT TOP 1 [CompanyName], [GardnersWebAPI_UserName], [GardnersWebAPI_Password] FROM [Gardlink4].[Gardlink].[Company] WHERE [Active] = 1 ORDER BY [CompanyID] DESC;`;

    console.log("[API /api/gardners/getGardlinkAccount] MSSQL Query for Company Details executed");

    let companyName: string | null = null;
    let gardnersApiUsername: string | null = null;
    let gardnersApiPassword: string | null = null;

    if (companyResult.recordset && companyResult.recordset.length > 0) {
      const companyRecord = companyResult.recordset[0];
      companyName = companyRecord.CompanyName || null;
      gardnersApiUsername = companyRecord.GardnersWebAPI_UserName || null;
      gardnersApiPassword = companyRecord.GardnersWebAPI_Password || null;
      console.log(`[API /api/gardners/getGardlinkAccount] Company details found: Name=${companyName}, API User=${gardnersApiUsername}`);
    } else {
      console.log("[API /api/gardners/getGardlinkAccount] No company details found in MSSQL");
    }

    if (accountNumber || companyName) { // Return success if we found at least account number or company name
      return NextResponse.json({ 
        accountNumber, 
        companyName,
        gardnersApiUsername,
        gardnersApiPassword
      });
    } else {
      // If neither account number nor company details were found
      return NextResponse.json({ error: "No Gardners account number or company details found in the local Gardlink database." }, { status: 404 });
    }

  } catch (mssqlErr: any) {
    console.error("[API /api/gardners/getGardlinkAccount] MSSQL Error:", mssqlErr);
    const errorMessage = mssqlErr && mssqlErr.message ? mssqlErr.message : String(mssqlErr);
    return NextResponse.json({ error: "Failed to retrieve account number due to a server error (MSSQL).", details: errorMessage }, { status: 500 });
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log("[API /api/gardners/getGardlinkAccount] MSSQL Database connection closed");
      } catch (closeErr: any) {
        console.error("[API /api/gardners/getGardlinkAccount] Error closing MSSQL database connection:", closeErr && closeErr.message ? closeErr.message : String(closeErr));
      }
    }
  }
}
