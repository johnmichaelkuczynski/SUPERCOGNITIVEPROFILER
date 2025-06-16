type TokenLogEntry = { tokens: number; timestamp: number };

class RateLimiter {
  private tokenLog: TokenLogEntry[] = [];
  private maxTokensPerMinute: number;
  private maxRequestsPerSecond: number;
  private concurrentLimit: number;
  private activeRequests = 0;
  private lastRequestTime = 0;

  constructor(config: {
    maxTokensPerMinute: number;
    maxRequestsPerSecond: number;
    concurrentLimit: number;
  }) {
    this.maxTokensPerMinute = config.maxTokensPerMinute;
    this.maxRequestsPerSecond = config.maxRequestsPerSecond;
    this.concurrentLimit = config.concurrentLimit;
  }

  private cleanOldTokens() {
    const now = Date.now();
    this.tokenLog = this.tokenLog.filter(entry => now - entry.timestamp < 60_000);
  }

  private tokensUsed(): number {
    this.cleanOldTokens();
    return this.tokenLog.reduce((sum, entry) => sum + entry.tokens, 0);
  }

  private async waitForRequestSlot(): Promise<void> {
    while (
      this.activeRequests >= this.concurrentLimit ||
      Date.now() - this.lastRequestTime < 1000 / this.maxRequestsPerSecond
    ) {
      await new Promise(res => setTimeout(res, 50));
    }
    this.lastRequestTime = Date.now();
    this.activeRequests++;
  }

  private releaseRequestSlot() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  async waitUntilAllowed(estimatedTokens: number): Promise<void> {
    await this.waitForRequestSlot();
    while (this.tokensUsed() + estimatedTokens > this.maxTokensPerMinute) {
      await new Promise(res => setTimeout(res, 250));
    }
    this.tokenLog.push({ tokens: estimatedTokens, timestamp: Date.now() });
  }

  async execute<T>(estimatedTokens: number, fn: () => Promise<T>, retries = 3): Promise<T> {
    await this.waitUntilAllowed(estimatedTokens);

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (err: any) {
        if (err?.response?.status === 429 || err?.code === 'RateLimitError') {
          const waitTime = 30 * 1000 * (attempt + 1);
          console.log(`Rate limit hit, waiting ${waitTime/1000}s before retry ${attempt + 1}/${retries}`);
          await new Promise(res => setTimeout(res, waitTime));
        } else {
          throw err;
        }
      } finally {
        this.releaseRequestSlot();
      }
    }

    throw new Error("Max retries exceeded for rate-limited request.");
  }
}

// Configure for each LLM
export const ClaudeLimiter = new RateLimiter({
  maxTokensPerMinute: 32000,
  maxRequestsPerSecond: 2,
  concurrentLimit: 3,
});

export const OpenAILimiter = new RateLimiter({
  maxTokensPerMinute: 300000,
  maxRequestsPerSecond: 10,
  concurrentLimit: 5,
});

export const DeepSeekLimiter = new RateLimiter({
  maxTokensPerMinute: 50000,
  maxRequestsPerSecond: 5,
  concurrentLimit: 3,
});