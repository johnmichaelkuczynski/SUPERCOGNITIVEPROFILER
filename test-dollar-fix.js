// Test the dollar sign fix
const testContent = "When a person willingly pays \\$200 for dinner at an exclusive restaurant, the Veblen function would include not just the taste of the food but also the prestige of being seen at the establishment. Similarly, when someone pays \\$5 for a coffee.";

console.log('BEFORE FIX:');
console.log(testContent);

// Apply the fix
const fixedContent = testContent.replace(/\\\$/g, '$');

console.log('\nAFTER FIX:');
console.log(fixedContent);

console.log('\nTEST RESULTS:');
console.log('Contains $200:', fixedContent.includes('$200'));
console.log('Contains $5:', fixedContent.includes('$5'));
console.log('No escaped \\$200:', !fixedContent.includes('\\$200'));
console.log('No escaped \\$5:', !fixedContent.includes('\\$5'));
console.log('Fix successful:', fixedContent.includes('$200') && fixedContent.includes('$5') && !fixedContent.includes('\\$200') && !fixedContent.includes('\\$5'));