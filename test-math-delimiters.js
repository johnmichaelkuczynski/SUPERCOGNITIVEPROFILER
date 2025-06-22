const { sanitizeMathAndCurrency, validateMathDelimiters, runTests } = require('./server/services/mathDelimiterFixer.ts');

// Test the math delimiter and currency protection
const testText = "The pasta costs $25 but the utility function $U^{\\text{Veblen}}$ shows different preferences. Also consider \\[U_{Smith} = \\max \\sum...\\] and standard $$E = mc^2$$ with a $50 processing fee.";

console.log('Original text:');
console.log(testText);

const sanitized = sanitizeMathAndCurrency(testText);
console.log('\nSanitized text:');
console.log(sanitized);

const validation = validateMathDelimiters(testText);
console.log('\nValidation results:');
console.log(validation);

console.log('\nRunning all test cases:');
runTests();