const Logger = require('../monitor/Logger');

/**
 * CacheManager - 缓存管理器
 * 使用 LRU 缓存策略管理地图数据缓存
 */
class CacheManager {
  constructor(maxSize = 1000) {
    this.logger = new Logger();
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }
  
  async initialize() {
    this.logger.info({ message: 'CacheManager initialized', maxSize: this.maxSize });
  }
  
  /**
   * 获取缓存值
   */
  get(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      
      // 更新访问顺序（LRU）
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
      
      return this.cache.get(key);
    }
    
    this.stats.misses++;
    return null;
  }
  
  /**
   * 设置缓存值
   */
  set(key, value) {
    // 如果缓存已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }
    
    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }
    
    this.cache.set(key, value);
    this.accessOrder.push(key);
  }
  
  /**
   * 移除最少使用的项
   */
  evict() {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }
  
  /**
   * 检查是否存在
   */
  has(key) {
    return this.cache.has(key);
  }
  
  /**
   * 删除缓存
   */
  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return true;
    }
    return false;
  }
  
  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
    this.logger.info({ message: 'Cache cleared' });
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    };
  }
  
  async shutdown() {
    this.clear();
    this.logger.info({ message: 'CacheManager shutdown' });
  }
}

module.exports = CacheManager;
