// Test the actual MathRenderer conversion
const text = "\\neg P \\wedge Q";

const latexToUnicode = {
  '\\neg': '¬',
  '\\wedge': '∧',
  '\\vee': '∨',
  '\\leftrightarrow': '↔',
  '\\Leftrightarrow': '⇔'
};

let processed = text;
Object.entries(latexToUnicode).forEach(([latexSymbol, unicode]) => {
  processed = processed.split(latexSymbol).join(unicode);
});

console.log('Original:', text);
console.log('Processed:', processed);