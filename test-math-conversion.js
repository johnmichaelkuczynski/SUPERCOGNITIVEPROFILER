// Test mathematical notation conversion directly
const { renderMathematicalNotation } = require('./server/services/mathUtils.ts');

const testCases = [
  '\\{α\\}',
  '\\oplus',
  '\\alpha',
  '\\wedge',
  '\\cup'
];

console.log('Testing mathematical notation conversion:');
testCases.forEach(test => {
  const result = renderMathematicalNotation(test);
  console.log(`"${test}" → "${result}"`);
});

// Test the exact failing pattern from logs
const fullTest = "Test: \\{α\\} and \\oplus symbols";
console.log('\nFull test:');
console.log(`Input: "${fullTest}"`);
console.log(`Output: "${renderMathematicalNotation(fullTest)}"`);