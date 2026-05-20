/**
 * Simple in-memory TTL cache.
 * No Redis needed — fast local Map with automatic expiry.
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

export const getCache = <T>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.value as T;
};

export const setCache = <T>(key: string, value: T, ttlSeconds: number): void => {
    cache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
};

export const clearCache = (key: string): void => {
    cache.delete(key);
};

export const clearCacheByPrefix = (prefix: string): void => {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
};
