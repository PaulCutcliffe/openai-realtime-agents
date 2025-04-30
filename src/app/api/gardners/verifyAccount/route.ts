import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const { accountNumber, booksellerName } = await request.json();

  if (!accountNumber || !booksellerName) {
    return NextResponse.json({ error: 'Missing accountNumber or booksellerName' }, { status: 400 });
  }

  // Load CSV from filesystem
  let csvContent = '';
  try {
    const csvPath = path.join(process.cwd(), 'src', 'app', 'data', 'accounts.csv');
    csvContent = fs.readFileSync(csvPath, 'utf-8');
  } catch (err) {
    console.error('[verifyAccount API] Error reading CSV:', err);
    return NextResponse.json({ error: 'Could not read accounts data' }, { status: 500 });
  }

  // Parse CSV lines
  const lines = csvContent.trim().split(/\r?\n/).slice(1); // Skip header
  const accountsMap: Map<string, string> = new Map();
  lines.forEach(line => {
    if (!line) return;
    const cols = line.split(',');
    const codePart = cols[0];
    const nameRaw = cols.slice(1).join(',');
    const cleanName = nameRaw.replace(/^"|"$/g, '').trim(); // Remove surrounding quotes and trim
    if (codePart) {
      accountsMap.set(codePart.trim().toUpperCase(), cleanName);
    }
  });

  // Normalize and verify
  const codeUpper = accountNumber.trim().toUpperCase();
  const expectedNameRaw = accountsMap.get(codeUpper);
  let verified = false;

  if (expectedNameRaw) {
    const providedLower = booksellerName.trim().toLowerCase();
    const expectedLower = expectedNameRaw.trim().toLowerCase();
    verified = providedLower.includes(expectedLower) || expectedLower.includes(providedLower);
  }

  // Log verification attempt
  console.log(`[verifyAccount API] Input: ${accountNumber}/${booksellerName}, Found: '${expectedNameRaw || 'NOT FOUND'}', Verified: ${verified}`);

  // Generate credentials only if verified
  let username = '';
  let password = '';
  if (verified) {
    username = `${accountNumber}GFW@${accountNumber}`;
    password = `GardAP1@${accountNumber.toLowerCase()}`;
  }

  return NextResponse.json({ verified, username, password });
}