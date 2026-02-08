import { calculatePrimeStack } from './rgp-prime-stack-engine';

const sampleBirthChart = {
  sun: 355,
  moon: 120,
  earth: 175,
  nodes: 85,
  chiron: 135,
  mercury: 10,
  venus: 340,
  mars: 180,
  jupiter: 45,
  saturn: 210,
  uranus: 300,
  neptune: 270,
  pluto: 225,
  northNode: 85,
  southNode: 265,
};

const primeStackMap = calculatePrimeStack(sampleBirthChart as any, {});
console.log('Prime Stack positions:', primeStackMap.positions.length);
primeStackMap.positions.forEach((pos) => {
  console.log(`Position ${pos.position}: ${pos.name}, weightedFrequency: ${pos.weightedFrequency}, isNaN: ${isNaN(pos.weightedFrequency)}`);
});
