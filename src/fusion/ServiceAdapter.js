const Logger = require('../monitor/Logger');

/**
 * ServiceAdapter - 服务适配器
 * 提供统一的服务接口适配
 */
class ServiceAdapter {
  constructor(mapEngine) {
    this.logger = new Logger();
    this.mapEngine = mapEngine;
    this.adapters = new Map();
  }
  
  /**
   * 注册服务适配器
   */
  registerAdapter(serviceType, adapter) {
    this.adapters.set(serviceType, adapter);
    this.logger.info({ message: 'Service adapter registered', serviceType });
  }
  
  /**
   * 获取适配器
   */
  getAdapter(serviceType) {
    return this.adapters.get(serviceType);
  }
  
  /**
   * 适配服务
   */
  async adaptService(service) {
    const adapter = this.getAdapter(service.type);
    
    if (!adapter) {
      throw new Error(`No adapter for service type: ${service.type}`);
    }
    
    return await adapter.adapt(service);
  }
  
  /**
   * 执行服务
   */
  async execute(service, operation, params = {}) {
    const adapter = this.getAdapter(service.type);
    
    if (!adapter) {
      throw new Error(`No adapter for service type: ${service.type}`);
    }
    
    return await adapter.execute(service, operation, params);
  }
}

module.exports = ServiceAdapter;
