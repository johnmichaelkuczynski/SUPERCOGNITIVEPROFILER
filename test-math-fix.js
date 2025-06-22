// Test math delimiter conversion
function sanitizeMathAndCurrency(text) {
  console.log('🔧 Starting advanced math delimiter and currency sanitization');
  
  // Step 1: Protect all currency patterns
  const currencyPatterns = [
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g,
    /\$(\d+\.?\d*)\s*(?:USD|dollars?|bucks?)\b/gi,
    /(?:USD|dollars?)\s*\$(\d+\.?\d*)\b/gi,
    /\$(\d+)\s*(?:million|billion|thousand|k)\b/gi
  ];
  
  const currencyReplacements = [];
  let placeholderIndex = 0;
  
  currencyPatterns.forEach(pattern => {
    text = text.replace(pattern, (match) => {
      const placeholder = `CURRENCY_PLACEHOLDER_${placeholderIndex}`;
      currencyReplacements.push(match);
      placeholderIndex++;
      return placeholder;
    });
  });
  
  console.log(`🔧 Protected ${currencyReplacements.length} currency expressions`);
  
  // Step 2: Identify and convert legitimate math expressions
  const mathIndicators = /[\^_{}\\]|\\[a-zA-Z]+|\b(?:sin|cos|tan|log|ln|exp|sqrt|sum|int|lim|alpha|beta|gamma|theta|pi|sigma|mu|lambda|delta|epsilon|omega)\b/;
  
  text = text.replace(/\$([^$\n]+)\$/g, (match, content) => {
    if (mathIndicators.test(content)) {
      console.log(`🔧 Converting math expression: $${content}$`);
      return `\\(${content}\\)`;
    }
    console.log(`🔧 Keeping as regular text: ${match}`);
    return match;
  });
  
  // Step 3: Restore currency symbols
  currencyReplacements.forEach((currency, index) => {
    const placeholder = `CURRENCY_PLACEHOLDER_${index}`;
    text = text.replace(placeholder, currency);
  });
  
  console.log('🔧 Restored all currency symbols');
  return text;
}

// Test with the exact text from the screenshot
const testText = `Smith Rationality, named for Adam Smith's classical economic actor, seeks to maximize resource efficiency, prioritizing caloric value, cost minimization, and practical utility. We see Smith Rationality in action when a college student chooses to cook ramen at home instead of ordering takeout to save money for textbooks. Or when a parent prepares a week's worth of lunches on Sunday evening to reduce both cost and daily preparation time.

Smith (1776/1976) himself noted in his seminal work, "It is not from the benevolence of the butcher, the brewer, or the baker that we expect our dinner, but from their regard to their own interest" (p. 18). This rational self-interest can be expressed mathematically as a utility function where consumers seek to maximize their utility subject to budget constraints: $U^{Smith} = max \\sum_{i=1}^{n} u_i(x_i)$ subject to $\\sum_{i=1}^{n} p_i x_i^* \\leq m$ where $U$ represents Smith Rational utility, $u(x_i)$ is the utility derived from good $x_i$, and $m$ is the price of good $x_i$, and $m$ is the consumer's budget constraint.

Under this framework, the rational consumer makes choices that provide maximum satisfaction given limited resources. In contrast, Veblen Rationality operates according to a different optimization principle: $U^{Veblen} = max \\sum_{i=1}^{n} v(x_i, S_i)$ subject to $\\sum_{i=1}^{n} p_i x_i \\leq m$ where $v(x_i, S_i)$ represents the social utility derived from both the good itself and its signaling value within social context $S_i$.`;

console.log('=== INPUT ===');
console.log(testText);
console.log('\n=== OUTPUT ===');
console.log(sanitizeMathAndCurrency(testText));