import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW = "1 h" as const;

function getLimiter(bucket: string, max: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, WINDOW),
    prefix: `ai-spend-audit:${bucket}`,
  });
}

/** Returns false when limited (or when Redis missing in dev — allows traffic). */
export async function allowRequest(bucket: string, key: string, maxPerHour: number) {
  const limiter = getLimiter(bucket, maxPerHour);
  if (!limiter) return true;
  const { success } = await limiter.limit(key);
  return success;
}
