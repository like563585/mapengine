const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const ServiceRegistry = require('./ServiceRegistry');
const HealthCheck = require('./HealthCheck');
const ConfigManager = require('./ConfigManager');
const Logger = require('../monitor/Logger');

/**
 * ServiceManager - 服务管理器
 * 负责服务的生命周期管理、配置、监控等
 */
class ServiceManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.logger = new Logger();
    this.services = new Map();
    this.registry = new ServiceRegistry();
    this.healthCheck = new HealthCheck();
    this.configManager = new ConfigManager();
    
    this.options = {
      checkInterval: options.checkInterval || 30000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      timeout: options.timeout || 5000
    };
    
    this.checkTimer = null;
  }
  
  /**
   * 创建服务
   */
  async createService(serviceConfig) {
    const serviceId = serviceConfig.id || uuidv4();
    
    // 验证配置
    await this.configManager.validate(serviceConfig);
    
    const service = {
      id: serviceId,
      name: serviceConfig.name,
      type: serviceConfig.type,
      status: 'created',
      config: serviceConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: {
        requests: 0,
        errors: 0,
        responseTime: 0
      }
    };
    
    this.services.set(serviceId, service);
    this.registry.register(serviceId, service);
    
    this.logger.info({ message: 'Service created', serviceId, name: service.name });
    this.emit('service:created', service);
    
    return service;
  }
  
  /**
   * 启动服务
   */
  async startService(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    if (service.status === 'running') {
      return service;
    }
    
    try {
      service.status = 'starting';
      this.emit('service:starting', { serviceId });
      
      // 模拟启动过程
      await this.executeStartup(service);
      
      service.status = 'running';
      service.startedAt = new Date();
      service.updatedAt = new Date();
      
      this.logger.info({ message: 'Service started', serviceId });
      this.emit('service:started', service);
      
      return service;
    } catch (error) {
      service.status = 'failed';
      this.logger.error({ message: 'Failed to start service', serviceId, error: error.message });
      this.emit('service:failed', { serviceId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 停止服务
   */
  async stopService(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    if (service.status === 'stopped') {
      return service;
    }
    
    try {
      service.status = 'stopping';
      this.emit('service:stopping', { serviceId });
      
      // 模拟关闭过程
      await this.executeShutdown(service);
      
      service.status = 'stopped';
      service.stoppedAt = new Date();
      service.updatedAt = new Date();
      
      this.logger.info({ message: 'Service stopped', serviceId });
      this.emit('service:stopped', service);
      
      return service;
    } catch (error) {
      this.logger.error({ message: 'Failed to stop service', serviceId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 重启服务
   */
  async restartService(serviceId) {
    await this.stopService(serviceId);
    return await this.startService(serviceId);
  }
  
  /**
   * 更新服务配置
   */
  async updateServiceConfig(serviceId, newConfig) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    // 验证新配置
    await this.configManager.validate(newConfig);
    
    const oldConfig = service.config;
    service.config = { ...oldConfig, ...newConfig };
    service.updatedAt = new Date();
    
    // 如果服务运行中，需要重新加载配置
    if (service.status === 'running') {
      await this.reloadServiceConfig(serviceId);
    }
    
    this.logger.info({ message: 'Service config updated', serviceId });
    this.emit('service:configUpdated', service);
    
    return service;
  }
  
  /**
   * 获取服务
   */
  getService(serviceId) {
    return this.services.get(serviceId);
  }
  
  /**
   * 获取所有服务
   */
  getAllServices() {
    return Array.from(this.services.values());
  }
  
  /**
   * 删除服务
   */
  async deleteService(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }
    
    if (service.status === 'running') {
      await this.stopService(serviceId);
    }
    
    this.services.delete(serviceId);
    this.registry.unregister(serviceId);
    
    this.logger.info({ message: 'Service deleted', serviceId });
    this.emit('service:deleted', { serviceId });
  }
  
  /**
   * 启动健康检查
   */
  async startHealthCheck() {
    this.checkTimer = setInterval(async () => {
      for (const [serviceId, service] of this.services.entries()) {
        if (service.status === 'running') {
          const isHealthy = await this.healthCheck.check(service);
          
          if (!isHealthy && service.retries < this.options.maxRetries) {
            service.retries = (service.retries || 0) + 1;
            this.logger.warn({ message: 'Service unhealthy', serviceId, retry: service.retries });
            
            try {
              await this.restartService(serviceId);
            } catch (error) {
              this.logger.error({ message: 'Failed to restart service', serviceId });
            }
          }
        }
      }
    }, this.options.checkInterval);
    
    this.logger.info({ message: 'Health check started', interval: this.options.checkInterval });
  }
  
  /**
   * 执行启动流程（模拟）
   */
  async executeStartup(service) {
    return new Promise((resolve) => {
      setTimeout(() => {
        service.retries = 0;
        resolve();
      }, 100);
    });
  }
  
  /**
   * 执行关闭流程（模拟）
   */
  async executeShutdown(service) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
  }
  
  /**
   * 重新加载服务配置
   */
  async reloadServiceConfig(serviceId) {
    // 实现配置重新加载逻辑
    return true;
  }
  
  /**
   * 关闭服务管理器
   */
  async shutdown() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    
    // 停止所有运行中的服务
    for (const [serviceId, service] of this.services.entries()) {
      if (service.status === 'running') {
        await this.stopService(serviceId).catch(err => {
          this.logger.error({ message: 'Error stopping service during shutdown', serviceId });
        });
      }
    }
    
    this.logger.info({ message: 'ServiceManager shutdown' });
  }
}

module.exports = ServiceManager;
