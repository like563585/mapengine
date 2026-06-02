const Logger = require('../monitor/Logger');

/**
 * ServiceRegistry - 服务注册表
 * 管理服务的注册和发现
 */
class ServiceRegistry {
  constructor() {
    this.logger = new Logger();
    this.services = new Map();
    this.subscribers = new Set();
  }
  
  /**
   * 注册服务
   */
  register(serviceId, service) {
    this.services.set(serviceId, service);
    this.notifySubscribers('service:registered', { serviceId, service });
    this.logger.info({ message: 'Service registered', serviceId });
  }
  
  /**
   * 注销服务
   */
  unregister(serviceId) {
    this.services.delete(serviceId);
    this.notifySubscribers('service:unregistered', { serviceId });
    this.logger.info({ message: 'Service unregistered', serviceId });
  }
  
  /**
   * 获取服务
   */
  get(serviceId) {
    return this.services.get(serviceId);
  }
  
  /**
   * 查询服务
   */
  query(criteria) {
    const results = [];
    for (const [id, service] of this.services.entries()) {
      if (this.matches(service, criteria)) {
        results.push(service);
      }
    }
    return results;
  }
  
  /**
   * 检查服务是否匹配条件
   */
  matches(service, criteria) {
    if (criteria.type && service.type !== criteria.type) return false;
    if (criteria.status && service.status !== criteria.status) return false;
    if (criteria.name && !service.name.includes(criteria.name)) return false;
    return true;
  }
  
  /**
   * 获取所有服务
   */
  getAll() {
    return Array.from(this.services.values());
  }
  
  /**
   * 订阅服务事件
   */
  subscribe(subscriber) {
    this.subscribers.add(subscriber);
  }
  
  /**
   * 取消订阅
   */
  unsubscribe(subscriber) {
    this.subscribers.delete(subscriber);
  }
  
  /**
   * 通知订阅者
   */
  notifySubscribers(event, data) {
    for (const subscriber of this.subscribers) {
      if (typeof subscriber === 'function') {
        subscriber(event, data);
      }
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      total: this.services.size,
      byStatus: {},
      byType: {}
    };
    
    for (const service of this.services.values()) {
      stats.byStatus[service.status] = (stats.byStatus[service.status] || 0) + 1;
      stats.byType[service.type] = (stats.byType[service.type] || 0) + 1;
    }
    
    return stats;
  }
}

module.exports = ServiceRegistry;
