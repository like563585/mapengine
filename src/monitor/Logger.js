const pino = require('pino');

/**
 * Logger - 日志系统
 * 提供统一的日志记录功能
 */
class Logger {
  constructor(options = {}) {
    this.options = {
      level: options.level || process.env.LOG_LEVEL || 'info',
      transport: options.transport || this.getDefaultTransport(),
      ...options
    };
    
    this.logger = pino({
      level: this.options.level,
      transport: this.options.transport
    });
  }
  
  /**
   * 获取默认的日志传输配置
   */
  getDefaultTransport() {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    };
  }
  
  /**
   * 信息日志
   */
  info(message) {
    if (typeof message === 'string') {
      this.logger.info(message);
    } else {
      this.logger.info(message);
    }
  }
  
  /**
   * 警告日志
   */
  warn(message) {
    this.logger.warn(message);
  }
  
  /**
   * 错误日志
   */
  error(message) {
    this.logger.error(message);
  }
  
  /**
   * 调试日志
   */
  debug(message) {
    this.logger.debug(message);
  }
  
  /**
   * 追踪日志
   */
  trace(message) {
    this.logger.trace(message);
  }
}

module.exports = Logger;
