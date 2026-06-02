const Logger = require('./Logger');

/**
 * Metrics - 指标收集器
 * 收集和管理系统性能指标
 */
class Metrics {
  constructor(options = {}) {
    this.logger = new Logger();
    this.metrics = [];
    this.maxSize = options.maxSize || 10000;
  }
  
  /**
   * 记录指标
   */
  record(metric) {
    this.metrics.push(metric);
    
    // 限制指标数量
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift();
    }
  }
  
  /**
   * 获取所有指标
   */
  getMetrics(filter = null) {
    if (!filter) {
      return this.metrics;
    }
    
    return this.metrics.filter(m => this.matchesFilter(m, filter));
  }
  
  /**
   * 过滤匹配
   */
  matchesFilter(metric, filter) {
    if (filter.type && metric.type !== filter.type) return false;
    if (filter.startTime && new Date(metric.timestamp) < new Date(filter.startTime)) return false;
    if (filter.endTime && new Date(metric.timestamp) > new Date(filter.endTime)) return false;
    return true;
  }
  
  /**
   * 获取最新指标
   */
  getLatest(count = 1) {
    return this.metrics.slice(-count);
  }
  
  /**
   * 计算平均值
   */
  average(field) {
    if (this.metrics.length === 0) return 0;
    
    const sum = this.metrics.reduce((acc, m) => {
      return acc + (this.getFieldValue(m, field) || 0);
    }, 0);
    
    return sum / this.metrics.length;
  }
  
  /**
   * 获取字段值
   */
  getFieldValue(obj, path) {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return null;
      }
    }
    
    return value;
  }
  
  /**
   * 清空指标
   */
  clear() {
    this.metrics = [];
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      metricsCount: this.metrics.length,
      maxSize: this.maxSize,
      oldestMetric: this.metrics[0]?.timestamp,
      newestMetric: this.metrics[this.metrics.length - 1]?.timestamp
    };
  }
}

module.exports = Metrics;
