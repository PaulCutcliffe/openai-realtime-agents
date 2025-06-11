import assert from 'node:assert/strict';

function isValidEan13(ean) {
  if (typeof ean !== 'string') return false;
  ean = ean.trim();
  if (!/^[0-9]{13}$/.test(ean)) return false;
  const digits = ean.split('').map(Number);
  const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return check === digits[12];
}

const samples = [
  ['4006381333931', true],
  ['1234567890123', false],
  ['9783161484100', true],
  ['9780571363611', false],
  ['9780571366361', true]
];

for (const [ean, expected] of samples) {
  assert.strictEqual(isValidEan13(ean), expected, `Unexpected validity for ${ean}`);
}

console.log('All EAN checks passed');
