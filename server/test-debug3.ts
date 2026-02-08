const PRIME_STACK_CONFIG = [
  { position: 1, name: 'Conscious Sun', planetaryBody: 'Sun', weight: 1.8 },
  { position: 2, name: 'Design Sun', planetaryBody: 'Earth', weight: 1.3 },
  { position: 3, name: 'Personality Sun', planetaryBody: 'Sun', weight: 1.0 },
  { position: 4, name: 'Conscious Moon', planetaryBody: 'Moon', weight: 1.0 },
  { position: 5, name: 'Design Moon', planetaryBody: 'Moon', weight: 0.9 },
  { position: 6, name: 'Personality Moon', planetaryBody: 'Moon', weight: 0.8 },
  { position: 7, name: 'Nodes', planetaryBody: 'Nodes', weight: 0.6 },
  { position: 8, name: 'Earth', planetaryBody: 'Earth', weight: 0.8 },
  { position: 9, name: 'Chiron', planetaryBody: 'Chiron', weight: 0.5 },
];

function calculateWeightedFrequency(position: number, baseFrequency: number): number {
  const config = PRIME_STACK_CONFIG.find(p => p.position === position);
  console.log(`Position ${position}: config = ${JSON.stringify(config)}`);
  if (!config) return baseFrequency;
  const result = baseFrequency * config.weight;
  console.log(`  baseFrequency=${baseFrequency}, weight=${config.weight}, result=${result}`);
  return result;
}

console.log('Testing calculateWeightedFrequency:');
for (let i = 1; i <= 9; i++) {
  const result = calculateWeightedFrequency(i, 50);
  console.log(`Position ${i}: result = ${result}\n`);
}
