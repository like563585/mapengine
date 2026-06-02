const EventEmitter = require('events');
const ServiceAdapter = require('./ServiceAdapter');
const EventBus = require('./EventBus');
const Logger = require('../monitor/Logger');

/**
 * MapServiceFusion - 地图服务融合核心
 * 将地图引擎和服务管理系统融合为一体
 */
class MapServiceFusion extends EventEmitter {
  constructor(mapEngine, serviceManager, options = {}) {
    super();
    this.logger = new Logger();
    this.mapEngine = mapEngine;
    this.serviceManager = serviceManager;
    this.eventBus = new EventBus();
    this.serviceAdapter = new ServiceAdapter(mapEngine);
    
    this.options = {
      autoStart: options.autoStart !== false,
      serviceCheckInterval: options.serviceCheckInterval || 30000
    };
    
    this.isStarted = false;
    this.isInitialized = false;
  }
  
  /**
   * 启动融合系统
   */
  async start() {
    if (this.isStarted) {
      this.logger.warn({ message: 'Fusion already started' });
      return;
    }
    
    try {
      this.logger.info({ message: 'MapServiceFusion starting' });
      
      // 初始化地图引擎
      await this.mapEngine.initialize();
      
      // 启动事件总线
      this.eventBus.start();
      this.setupEventListeners();
      
      // 启动服务健康检查
      await this.serviceManager.startHealthCheck();
      
      this.isStarted = true;
      this.isInitialized = true;
      
      this.logger.info({ message: 'MapServiceFusion started' });
      this.emit('started');
      
      return true;
    } catch (error) {
      this.logger.error({ message: 'Failed to start fusion', error: error.message });
      throw error;
    }
  }
  
  /**
   * 停止融合系统
   */
  async stop() {
    if (!this.isStarted) {
      return;
    }
    
    try {
      this.logger.info({ message: 'MapServiceFusion stopping' });
      
      // 停止服务管理器
      await this.serviceManager.shutdown();
      
      // 停止事件总线
      this.eventBus.stop();
      
      // 关闭地图引擎
      await this.mapEngine.shutdown();
      
      this.isStarted = false;
      
      this.logger.info({ message: 'MapServiceFusion stopped' });
      this.emit('stopped');
    } catch (error) {
      this.logger.error({ message: 'Error during shutdown', error: error.message });
      throw error;
    }
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 服务事件
    this.serviceManager.on('service:created', (service) => {
      this.eventBus.emit('service:created', service);
      this.logger.info({ message: 'Service created event', serviceId: service.id });
    });
    
    this.serviceManager.on('service:started', (service) => {
      this.eventBus.emit('service:started', service);
      this.logger.info({ message: 'Service started event', serviceId: service.id });
    });
    
    this.serviceManager.on('service:stopped', (service) => {
      this.eventBus.emit('service:stopped', service);
    });
    
    this.serviceManager.on('service:failed', (data) => {
      this.eventBus.emit('service:failed', data);
      this.logger.error({ message: 'Service failed event', serviceId: data.serviceId });
    });
    
    // 地图引擎事件
    this.mapEngine.on('initialized', () => {
      this.eventBus.emit('map:initialized');
    });
    
    this.mapEngine.on('tile:loaded', (data) => {
      this.eventBus.emit('tile:loaded', data);
    });
    
    this.mapEngine.on('layer:added', (layer) => {
      this.eventBus.emit('layer:added', layer);
    });
  }
  
  /**
   * 创建地图服务
   */
  async createMapService(serviceConfig) {
    const service = await this.serviceManager.createService({
      ...serviceConfig,
      type: 'map'
    });
    
    // 自动启动
    if (this.options.autoStart) {
      await this.serviceManager.startService(service.id);
    }
    
    return service;
  }
  
  /**
   * 获取瓦片（通过融合接口）
   */
  async getTile(z, x, y, options = {}) {
    if (!this.isStarted) {
      throw new Error('Fusion not started');
    }
    
    try {
      return await this.mapEngine.getTile(z, x, y, options);
    } catch (error) {
      this.logger.error({ message: 'Failed to get tile', z, x, y, error: error.message });
      throw error;
    }
  }
  
  /**
   * 执行空间查询
   */
  async spatialQuery(bbox, options = {}) {
    if (!this.isStarted) {
      throw new Error('Fusion not started');
    }
    
    return await this.mapEngine.spatialQuery(bbox, options);
  }
  
  /**
   * 获取地图信息
   */
  getMapInfo() {
    if (!this.isStarted) {
      throw new Error('Fusion not started');
    }
    
    return this.mapEngine.getMapInfo();
  }
  
  /**
   * 获取服务列表
   */
  getServices() {
    return this.serviceManager.getAllServices();
  }
  
  /**
   * 获取服务
   */
  getService(serviceId) {
    return this.serviceManager.getService(serviceId);
  }
  
  /**
   * 启动服务
   */
  async startService(serviceId) {
    return await this.serviceManager.startService(serviceId);
  }
  
  /**
   * 停止服务
   */
  async stopService(serviceId) {
    return await this.serviceManager.stopService(serviceId);
  }
  
  /**
   * 重启服务
   */
  async restartService(serviceId) {
    return await this.serviceManager.restartService(serviceId);
  }
  
  /**
   * 获取系统状态
   */
  getStatus() {
    return {
      isStarted: this.isStarted,
      isInitialized: this.isInitialized,
      mapEngine: this.mapEngine.getMapInfo(),
      services: this.serviceManager.getAllServices(),
      eventBus: this.eventBus.getStats()
    };
  }
  
  /**
   * 获取系统指标
   */
  getMetrics() {
    return {
      mapEngine: this.mapEngine.getMetrics(),
      services: this.serviceManager.getAllServices().map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        metrics: s.metrics
      })),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MapServiceFusion;
