import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { compareTwoStrings } from 'string-similarity'; // Import similarity library
import { DoubleMetaphone } from 'natural'; // Import phonetic algorithm

// Helper function to normalize bookseller names for comparison
function normalizeName(name: string): string {
  let normalized = name
    .toLowerCase()
    // Replace common abbreviations/symbols before removing punctuation
    .replace(/&/g, 'and')
    .replace(/\bltd\b/g, '') // Remove 'ltd' as a whole word
    .replace(/\binc\b/g, '') // Remove 'inc' as a whole word
    // Remove leading 'the '
    .replace(/^the\s+/, '')
    // Remove all non-alphanumeric characters (except spaces)
    .replace(/[^a-z0-9\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // Define words to remove from the end if they are not the only word
  const trailingWordsToRemove = ['books', 'bookshop'];

  for (const word of trailingWordsToRemove) {
    const suffix = ` ${word}`;
    if (normalized.endsWith(suffix)) {
      const baseName = normalized.substring(0, normalized.length - suffix.length).trim();
      // Only remove the suffix if the base name is not empty
      if (baseName.length > 0) {
        normalized = baseName;
        // Optional: break if you only expect one such suffix, or remove to handle multiple (e.g., "X Books Bookshop")
        break;
      }
    }
  }
  // Also handle the case where the name *is* just the word itself (e.g. "Books")
  // If the normalized name exactly matches one of the trailing words, don't modify it further in this step.
  if (trailingWordsToRemove.includes(normalized)) {
      // If the name was *just* "books" or "bookshop" after initial cleanup, keep it as is.
      // This check might be redundant given the baseName.length > 0 check above, but adds clarity.
  }


  return normalized;
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
    // Use DoubleMetaphone phonetic matching
    const dm = new DoubleMetaphone();
    const [expCode1, expCode2] = dm.process(expectedNormalized);
    const [provCode1, provCode2] = dm.process(providedNormalized);
    const phoneticMatch =
      expCode1 === provCode1 || expCode1 === provCode2 ||
      expCode2 === provCode1 || expCode2 === provCode2;
    verified = phoneticMatch || similarity >= similarityThreshold;

    // Log comparison details
    console.log(
      `[verifyAccount API] Provided='${providedNormalized}', Expected='${expectedNormalized}', ` +
      `Similarity=${similarity.toFixed(2)}, PhoneticMatch=${phoneticMatch}, Threshold=${similarityThreshold}, Verified=${verified}`
    );

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