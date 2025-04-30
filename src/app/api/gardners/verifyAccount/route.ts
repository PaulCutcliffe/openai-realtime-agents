import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { compareTwoStrings } from 'string-similarity'; // Import the library

// Helper function to normalize bookseller names for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^the\s+/, '') // Remove leading "the "
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

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

  // Normalize and verify account number
  const originalCodeUpper = accountNumber.trim().toUpperCase();
  let codeUpper = originalCodeUpper;
  const formatRegex = /^[A-Z]{3}\d{3}$/; // LLLNNN
  const incorrectFormatRegex = /^[A-Z]{3}0\d{3}$/; // LLL0NNN

  if (!formatRegex.test(codeUpper) && incorrectFormatRegex.test(codeUpper)) {
    // If it looks like LLL0NNN, try removing the leading zero from digits
    codeUpper = codeUpper.substring(0, 3) + codeUpper.substring(4);
    console.log(`[verifyAccount API] Adjusted account number format from ${originalCodeUpper} to ${codeUpper}`);
  }

  const expectedNameRaw = accountsMap.get(codeUpper);
  let verified = false;
  const similarityThreshold = 0.7; // Adjust this threshold as needed (0 to 1)

  if (expectedNameRaw) {
    // Normalize names before comparing
    const providedNormalized = normalizeName(booksellerName);
    const expectedNormalized = normalizeName(expectedNameRaw);

    // Use string similarity for comparison
    const similarity = compareTwoStrings(providedNormalized, expectedNormalized);
    verified = similarity >= similarityThreshold;

    // Log comparison details
    console.log(`[verifyAccount API] Comparing normalized names: Provided='${providedNormalized}', Expected='${expectedNormalized}', Similarity=${similarity.toFixed(2)}, Threshold=${similarityThreshold}, Match=${verified}`);

  } else {
    console.log(`[verifyAccount API] Account code '${codeUpper}' (derived from '${originalCodeUpper}') not found in map.`);
  }

  // Log verification attempt result
  console.log(`[verifyAccount API] Input: ${accountNumber}/${booksellerName}, Using Code: ${codeUpper}, Found Expected Name: '${expectedNameRaw || 'NOT FOUND'}', Verified: ${verified}`);

  // Generate credentials only if verified, using the potentially corrected account number
  let username = '';
  let password = '';
  if (verified) {
    // Use codeUpper (the potentially corrected code) for credentials
    username = `${codeUpper}GFW@${codeUpper}`;
    password = `GardAP1@${codeUpper.toLowerCase()}`;
    console.log(`[verifyAccount API] Generated credentials using account code: ${codeUpper}`);
  } else {
    console.log(`[verifyAccount API] Verification failed, no credentials generated.`);
  }

  return NextResponse.json({ verified, username, password });
}