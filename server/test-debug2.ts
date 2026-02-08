import { calculateWeightedFrequency, PRIME_STACK_CONFIG } from './rgp-256-codon-engine';

console.log('PRIME_STACK_CONFIG:', PRIME_STACK_CONFIG);
console.log('');
console.log('Testing calculateWeightedFrequency:');
for (let i = 1; i <= 9; i++) {
  const result = calculateWeightedFrequency(i, 50);
  console.log(`Position ${i}: calculateWeightedFrequency(${i}, 50) = ${result}`);
}
