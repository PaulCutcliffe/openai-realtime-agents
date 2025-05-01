import { isValidEan13 } from './src/app/agentConfigs/gardnersAgent/salesAgent';

const samples = ['4006381333931','1234567890123','9783161484100', '9780571363611', '9780571366361'];
console.log('EAN','Valid?');
samples.forEach(ean => console.log(ean, isValidEan13(ean)));