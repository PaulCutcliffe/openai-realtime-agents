import assert from 'node:assert/strict';
import { isValidEan13 } from './src/app/agentConfigs/gardnersAgent/gardnersSalesAgent';

const samples: [string, boolean][] = [
  ['4006381333931', true],
  ['1234567890123', false],
  ['9783161484100', true],
  ['9780571363611', true],
  ['9780571366361', false]
];

for (const [ean, expected] of samples) {
  assert.strictEqual(isValidEan13(ean), expected, `Unexpected validity for ${ean}`);
}

console.log('All EAN checks passed');
