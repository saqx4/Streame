// Simple in-memory cache for API responses
type CacheEntry<T> = {
    data: T;
    timestamp: number;
    expiresAt: number;
};

class APICache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL = 5 * 60 * 1000; // 5 minutes default

    set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + ttl,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Clean up expired entries periodically
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}

export const apiCache = new APICache();

// Wrapper function to cache API calls
export async function cachedFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
): Promise<T> {
    const cached = apiCache.get<T>(key);
    if (cached !== null) {
        return cached;
    }

    const data = await fetchFn();
    apiCache.set(key, data, ttl);
    return data;
}

// Preload images to browser cache
export function preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
    });
}

// Preload multiple images in parallel
export async function preloadImages(srcs: string[]): Promise<void> {
    await Promise.allSettled(srcs.map(preloadImage));
}
