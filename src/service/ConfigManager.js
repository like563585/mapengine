const Joi = require('joi');
const Logger = require('../monitor/Logger');

/**
 * ConfigManager - 配置管理器
 * 负责服务配置的验证和管理
 */
class ConfigManager {
  constructor() {
    this.logger = new Logger();
    this.schemas = new Map();
    this.initializeSchemas();
  }
  
  /**
   * 初始化验证schema
   */
  initializeSchemas() {
    // 地图服务配置schema
    this.schemas.set('map', Joi.object({
      name: Joi.string().required(),
      type: Joi.string().equal('map').required(),
      source: Joi.string().required(),
      format: Joi.string().default('png'),
      maxZoom: Joi.number().min(0).max(20).default(18),
      minZoom: Joi.number().min(0).default(0),
      cache: Joi.object({
        enabled: Joi.boolean().default(true),
        ttl: Joi.number().default(3600)
      })
    }));
    
    // 数据服务配置schema
    this.schemas.set('data', Joi.object({
      name: Joi.string().required(),
      type: Joi.string().equal('data').required(),
      database: Joi.object({
        host: Joi.string().required(),
        port: Joi.number().required(),
        name: Joi.string().required(),
        user: Joi.string().required(),
        password: Joi.string().required()
      }).required(),
      query: Joi.string().required()
    }));
    
    // 处理服务配置schema
    this.schemas.set('process', Joi.object({
      name: Joi.string().required(),
      type: Joi.string().equal('process').required(),
      executable: Joi.string().required(),
      args: Joi.array().items(Joi.string()),
      timeout: Joi.number().default(5000),
      retries: Joi.number().default(3)
    }));
  }
  
  /**
   * 验证配置
   */
  async validate(config) {
    const schema = this.schemas.get(config.type);
    
    if (!schema) {
      throw new Error(`Unknown service type: ${config.type}`);
    }
    
    const { error, value } = schema.validate(config, {
      abortEarly: false,
      stripUnknown: false
    });
    
    if (error) {
      const details = error.details.map(d => ({
        path: d.path.join('.'),
        message: d.message
      }));
      throw new Error(`Config validation failed: ${JSON.stringify(details)}`);
    }
    
    return value;
  }
  
  /**
   * 获取配置schema
   */
  getSchema(serviceType) {
    return this.schemas.get(serviceType);
  }
  
  /**
   * 注册自定义schema
   */
  registerSchema(serviceType, schema) {
    this.schemas.set(serviceType, schema);
    this.logger.info({ message: 'Schema registered', serviceType });
  }
  
  /**
   * 合并配置
   */
  mergeConfigs(baseConfig, overrideConfig) {
    return this.deepMerge(baseConfig, overrideConfig);
  }
  
  /**
   * 深度合并对象
   */
  deepMerge(base, override) {
    const result = { ...base };
    
    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        if (typeof override[key] === 'object' && override[key] !== null) {
          result[key] = this.deepMerge(result[key] || {}, override[key]);
        } else {
          result[key] = override[key];
        }
      }
    }
    
    return result;
  }
}

module.exports = ConfigManager;
