/* Minimal smoke tests for TokenUtils */
const assert = require('assert');
const path = require('path');
const tokenPath = path.join(__dirname, '..', 'src', 'bg', 'token.js');
const { estimateTokens, analyzeRequestComplexity, getMaxTokensForComplexity } = require(tokenPath);

console.log('Running TokenUtils tests...');

assert.strictEqual(estimateTokens(''), 0);
assert(estimateTokens('abc') >= 1);

const simple = analyzeRequestComplexity('What is 2+2?');
assert.strictEqual(simple.type, 'simple_question');

const code = analyzeRequestComplexity('Please debug this function error stack');
assert.strictEqual(code.type, 'code_analysis');

const maxForLocal = getMaxTokensForComplexity({ type: 'complex_task' }, 'local');
const maxForGroq = getMaxTokensForComplexity({ type: 'complex_task' }, 'groq');
assert(maxForLocal > maxForGroq);

console.log('All TokenUtils tests passed.');
