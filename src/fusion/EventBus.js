const EventEmitter = require('events');
const Logger = require('../monitor/Logger');

/**
 * EventBus - 事件总线
 * 管理融合系统内的事件流
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.logger = new Logger();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.listeners = new Map();
  }
  
  /**
   * 启动事件总线
   */
  start() {
    this.logger.info({ message: 'EventBus started' });
  }
  
  /**
   * 停止事件总线
   */
  stop() {
    this.removeAllListeners();
    this.eventHistory = [];
    this.logger.info({ message: 'EventBus stopped' });
  }
  
  /**
   * 发送事件
   */
  emit(eventName, data) {
    this.recordEvent(eventName, data);
    return super.emit(eventName, data);
  }
  
  /**
   * 记录事件历史
   */
  recordEvent(eventName, data) {
    const event = {
      name: eventName,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.eventHistory.push(event);
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
  
  /**
   * 获取事件历史
   */
  getHistory(eventName = null, limit = 100) {
    let history = this.eventHistory;
    
    if (eventName) {
      history = history.filter(e => e.name === eventName);
    }
    
    return history.slice(-limit);
  }
  
  /**
   * 订阅事件
   */
  subscribe(eventName, handler) {
    this.on(eventName, handler);
    
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(handler);
  }
  
  /**
   * 取消订阅
   */
  unsubscribe(eventName, handler) {
    this.removeListener(eventName, handler);
    
    if (this.listeners.has(eventName)) {
      const handlers = this.listeners.get(eventName);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      eventTypes: this.listeners.size,
      totalListeners: 0,
      historySize: this.eventHistory.length,
      eventCounts: {}
    };
    
    for (const [eventName, handlers] of this.listeners.entries()) {
      stats.totalListeners += handlers.length;
      stats.eventCounts[eventName] = handlers.length;
    }
    
    return stats;
  }
}

module.exports = EventBus;
