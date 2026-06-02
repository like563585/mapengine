const EventEmitter = require('events');
const Metrics = require('./Metrics');
const Logger = require('./Logger');

/**
 * Monitor - 监控系统
 * 实时监控融合系统的性能和健康状态
 */
class Monitor extends EventEmitter {
  constructor(fusion, options = {}) {
    super();
    this.logger = new Logger();
    this.fusion = fusion;
    this.metrics = new Metrics();
    
    this.options = {
      interval: options.interval || 60000,
      enableAlerts: options.enableAlerts !== false,
      alertThresholds: options.alertThresholds || this.getDefaultThresholds()
    };
    
    this.monitorTimer = null;
    this.alerts = [];
  }
  
  /**
   * 获取默认告警阈值
   */
  getDefaultThresholds() {
    return {
      cpuUsage: 80,
      memoryUsage: 85,
      errorRate: 5,
      responseTime: 1000,
      cacheHitRate: 50
    };
  }
  
  /**
   * 启动监控
   */
  start() {
    this.monitorTimer = setInterval(() => {
      this.collectMetrics();
    }, this.options.interval);
    
    this.logger.info({ message: 'Monitor started', interval: this.options.interval });
  }
  
  /**
   * 收集指标
   */
  collectMetrics() {
    try {
      const systemMetrics = this.fusion.getMetrics();
      const status = this.fusion.getStatus();
      
      // 处理指标
      const processedMetrics = {
        timestamp: new Date().toISOString(),
        mapEngine: systemMetrics.mapEngine,
        services: systemMetrics.services,
        status: status
      };
      
      // 检查告警条件
      if (this.options.enableAlerts) {
        this.checkAlerts(processedMetrics);
      }
      
      // 存储指标
      this.metrics.record(processedMetrics);
      
      this.emit('metrics', processedMetrics);
    } catch (error) {
      this.logger.error({ message: 'Error collecting metrics', error: error.message });
    }
  }
  
  /**
   * 检查告警条件
   */
  checkAlerts(metrics) {
    const alerts = [];
    
    // 检查缓存命中率
    if (metrics.mapEngine.cacheStats) {
      const hitRate = parseFloat(metrics.mapEngine.cacheStats.hitRate);
      if (hitRate < this.options.alertThresholds.cacheHitRate) {
        alerts.push({
          level: 'warning',
          type: 'cache_hit_rate',
          message: `Cache hit rate low: ${hitRate}%`,
          value: hitRate,
          threshold: this.options.alertThresholds.cacheHitRate
        });
      }
    }
    
    // 检查服务状态
    for (const service of metrics.services) {
      if (service.status === 'failed') {
        alerts.push({
          level: 'error',
          type: 'service_failed',
          message: `Service ${service.name} failed`,
          serviceId: service.id
        });
      }
    }
    
    // 记录和发送告警
    for (const alert of alerts) {
      this.logger.warn(alert);
      this.alerts.push({
        ...alert,
        timestamp: new Date().toISOString()
      });
      this.emit('alert', alert);
    }
  }
  
  /**
   * 获取性能报告
   */
  getReport(timeRange = 3600000) { // 默认1小时
    const now = Date.now();
    const startTime = now - timeRange;
    
    const relevantMetrics = this.metrics.getMetrics()
      .filter(m => new Date(m.timestamp).getTime() >= startTime);
    
    return {
      timeRange: { start: new Date(startTime), end: new Date(now) },
      count: relevantMetrics.length,
      metrics: relevantMetrics,
      summary: this.calculateSummary(relevantMetrics)
    };
  }
  
  /**
   * 计算汇总统计
   */
  calculateSummary(metrics) {
    if (metrics.length === 0) {
      return null;
    }
    
    let totalCacheHits = 0;
    let totalRequests = 0;
    let serviceStats = {};
    
    for (const m of metrics) {
      if (m.mapEngine && m.mapEngine.cacheStats) {
        totalCacheHits += m.mapEngine.cacheStats.hits || 0;
      }
    }
    
    return {
      metricsCount: metrics.length,
      averageCacheHits: Math.round(totalCacheHits / metrics.length),
      period: `${metrics.length} samples`
    };
  }
  
  /**
   * 获取告警列表
   */
  getAlerts(limit = 100) {
    return this.alerts.slice(-limit);
  }
  
  /**
   * 清空告警
   */
  clearAlerts() {
    this.alerts = [];
  }
  
  /**
   * 停止监控
   */
  stop() {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
    
    this.logger.info({ message: 'Monitor stopped' });
  }
}

module.exports = Monitor;
