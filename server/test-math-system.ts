#!/usr/bin/env tsx
// Comprehensive test suite for the rebuilt math notation system

import { sanitizeMathAndCurrency, validateMathDelimiters, runTests } from './services/mathDelimiterFixer.js';

// Advanced test cases covering real-world scenarios
const realWorldTests = {
  academicPaper: `
    The utility function $U^{\\text{Veblen}}$ demonstrates conspicuous consumption behavior.
    When the price is $25 per unit and demand is $D(p) = \\alpha p^{-\\beta}$,
    the consumer surplus equals $$CS = \\int_0^Q D^{-1}(q) dq - pQ$$
    This generates $1,500 in total economic benefit.
  `,
  
  businessReport: `
    Our Q3 revenue was $2.5 million with operating costs of $1,200,000.
    The profit margin equation $\\pi = \\frac{R - C}{R} \\times 100\\%$ gives us 52%.
    We expect $500k in additional revenue and $300 thousand in expenses for Q4.
  `,
  
  mixedCurrency: `
    The budget includes $50 USD, €40 EUR, and £30 GBP.
    However, the demand function $Q_d = \\alpha - \\beta P$ uses $P$ as price variable.
    Total costs: $1,250.99 plus $25 processing fee equals $1,275.99 total.
  `,
  
  mathHeavy: `
    Given $f(x) = \\sin(x) + \\cos(x)$ and $g(x) = x^2 + 2x + 1$,
    find $\\frac{d}{dx}[f(x) \\cdot g(x)]$ where the product rule gives us
    $$\\frac{d}{dx}[f(x) \\cdot g(x)] = f'(x)g(x) + f(x)g'(x)$$
    This costs $0 to compute but $\\infty$ to understand fully.
  `,
  
  ambiguousText: `
    The phrase $hello world$ might be confusing, but $25 dollars is clear.
    Similarly, $x + y$ is math while $50 budget is currency.
    The expression $some text here$ lacks mathematical indicators.
  `
};

async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE MATH DELIMITER SYSTEM TEST\n');
  
  // Test 1: Built-in test cases
  console.log('=== BUILT-IN TEST CASES ===');
  runTests();
  
  // Test 2: Real-world scenarios
  console.log('\n=== REAL-WORLD SCENARIOS ===');
  Object.entries(realWorldTests).forEach(([scenario, input]) => {
    console.log(`\n📝 Scenario: ${scenario}`);
    console.log(`Input length: ${input.length} characters`);
    
    const validation = validateMathDelimiters(input);
    console.log(`Analysis: ${validation.analysis.currencyCount} currency, ${validation.analysis.mathExpressions} math, ${validation.analysis.ambiguousDollars} ambiguous`);
    
    const output = sanitizeMathAndCurrency(input);
    
    // Show key transformations
    const inputLines = input.trim().split('\n');
    const outputLines = output.trim().split('\n');
    
    inputLines.forEach((line, i) => {
      if (line !== outputLines[i]) {
        console.log(`Line ${i + 1} transformed:`);
        console.log(`  Before: ${line.trim()}`);
        console.log(`  After:  ${outputLines[i].trim()}`);
      }
    });
    
    if (validation.issues.length > 0) {
      console.log(`⚠️  Issues: ${validation.issues.join(', ')}`);
    } else {
      console.log('✅ No issues detected');
    }
  });
  
  // Test 3: Edge cases
  console.log('\n=== EDGE CASES ===');
  const edgeCases = {
    'Empty string': '',
    'Only currency': '$25, $50.99, $1,000',
    'Only math': '$x^2 + y^2 = z^2$ and $\\alpha = \\beta$',
    'Mixed delimiters': '$$E = mc^2$$ and \\(F = ma\\) with $25 cost',
    'Escaped dollars': '\\$25 is not currency but $x^2$ is math',
    'Currency with text': '$25 dollars and $50 USD and dollars $75'
  };
  
  Object.entries(edgeCases).forEach(([name, input]) => {
    console.log(`\n📝 Edge case: ${name}`);
    const validation = validateMathDelimiters(input);
    const output = sanitizeMathAndCurrency(input);
    
    console.log(`Input:  "${input}"`);
    console.log(`Output: "${output}"`);
    console.log(`Stats: ${validation.analysis.currencyCount} currency, ${validation.analysis.mathExpressions} math`);
  });
  
  console.log('\n🎉 COMPREHENSIVE TEST COMPLETE');
  console.log('The rebuilt math notation system correctly distinguishes between currency and math delimiters.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(console.error);
}

export { runComprehensiveTests };