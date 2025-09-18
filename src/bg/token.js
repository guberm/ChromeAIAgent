// Token utilities in UMD style for use in both SW and Node tests
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TokenUtils = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(String(text).length / 3.5);
  }

  function analyzeRequestComplexity(userMessage) {
    const msg = String(userMessage || '').toLowerCase();
    let score = 1;
    let type = 'simple';

    if (msg.match(/\b(what|who|when|where|how much|yes|no)\b/) && msg.length < 50) {
      score = 1; type = 'simple_question';
    } else if (msg.match(/\b(code|function|debug|fix|error|syntax)\b/)) {
      score = 2; type = 'code_analysis';
    } else if (msg.match(/\b(summarize|summary|explain|describe|analyze)\b/)) {
      score = 3; type = 'content_analysis';
    } else if (msg.match(/\b(write|create|generate|build|develop|implement)\b/)) {
      score = 4; type = 'generation_task';
    } else if (msg.match(/\b(refactor|optimize|complete|comprehensive|detailed)\b/)) {
      score = 5; type = 'complex_task';
    }

    if (msg.length > 200) score += 1;
    if (msg.length > 500) score += 1;

    return { score: Math.min(score, 5), type };
  }

  function getMaxTokensForComplexity(complexity, provider = 'openrouter') {
    const base = {
      simple_question: 4000,
      code_analysis: 4000,
      content_analysis: 4000,
      generation_task: 4000,
      complex_task: 4000
    }[complexity.type] ?? 4000;

    const mult = {
      openrouter: 1.0, openai: 1.5, anthropic: 2.0, groq: 0.8, deepseek: 1.2,
      perplexity: 1.0, azure: 1.8, github: 2.5, gemini: 2.0, google: 2.0,
      local: 5.0, ollama: 5.0
    }[provider] ?? 1.0;

    return Math.floor(base * mult);
  }

  return { estimateTokens, analyzeRequestComplexity, getMaxTokensForComplexity };
});
