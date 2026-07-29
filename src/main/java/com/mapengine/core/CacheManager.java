package com.mapengine.core;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
public class CacheManager {
    private final int maxSize;
    private final Map<String, Object> cache;
    private final Stats stats = new Stats();

    public CacheManager(int maxSize) {
        this.maxSize = maxSize > 0 ? maxSize : 1000;
        this.cache = new LinkedHashMap<String, Object>(maxSize, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Object> eldest) {
                boolean remove = size() > CacheManager.this.maxSize;
                if (remove) stats.evictions++;
                return remove;
            }
        };
    }

    public void initialize() {
        log.info("CacheManager initialized, maxSize={}", maxSize);
    }

    public Object get(String key) {
        if (cache.containsKey(key)) {
            stats.hits++;
            return cache.get(key);
        }
        stats.misses++;
        return null;
    }

    public void set(String key, Object value) {
        cache.put(key, value);
    }

    public boolean has(String key) { return cache.containsKey(key); }

    public boolean delete(String key) { return cache.remove(key) != null; }

    public void clear() { cache.clear(); log.info("Cache cleared"); }

    public Stats getStats() { return stats.snapshot(); }

    public void shutdown() { clear(); log.info("CacheManager shutdown"); }

    @Getter
    public static class Stats {
        private long hits = 0;
        private long misses = 0;
        private long evictions = 0;

        public Stats snapshot() {
            Stats s = new Stats();
            s.hits = this.hits;
            s.misses = this.misses;
            s.evictions = this.evictions;
            return s;
        }
    }
}
