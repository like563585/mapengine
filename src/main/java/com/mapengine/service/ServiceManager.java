package com.mapengine.service;

import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.concurrent.*;
import java.util.function.Consumer;

@Slf4j
public class ServiceManager {
    private final Map<String, Service> services = new ConcurrentHashMap<>();
    private final ServiceRegistry registry = new ServiceRegistry();
    private final HealthCheck healthCheck = new HealthCheck();
    private final ConfigManager configManager = new ConfigManager();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "service-health-check");
        t.setDaemon(true);
        return t;
    });

    private final long checkIntervalMillis;
    private final int maxRetries;

    public ServiceManager() {
        this(30_000L, 3);
    }

    public ServiceManager(long checkIntervalMillis, int maxRetries) {
        this.checkIntervalMillis = checkIntervalMillis;
        this.maxRetries = maxRetries;
    }

    public Service createService(Map<String, Object> serviceConfig) throws Exception {
        configManager.validate(serviceConfig);
        String id = serviceConfig.containsKey("id") ? String.valueOf(serviceConfig.get("id")) : UUID.randomUUID().toString();
        String name = (String) serviceConfig.getOrDefault("name", "service-" + id);
        String type = (String) serviceConfig.getOrDefault("type", "generic");
        Service s = new Service(id, name, type, serviceConfig);
        services.put(id, s);
        registry.register(id, s);
        log.info("Service created: {} ({})", id, name);
        return s;
    }

    public Service startService(String serviceId) throws Exception {
        Service s = services.get(serviceId);
        if (s == null) throw new NoSuchElementException("Service " + serviceId + " not found");
        if ("running".equals(s.getStatus())) return s;
        s.setStatus("starting");
        try {
            executeStartup(s);
            s.setStatus("running");
            s.setStartedAt(java.time.Instant.now());
            s.setUpdatedAt(java.time.Instant.now());
            log.info("Service started: {}", serviceId);
            return s;
        } catch (Exception e) {
            s.setStatus("failed");
            log.error("Failed to start service {}", serviceId, e);
            throw e;
        }
    }

    public Service stopService(String serviceId) throws Exception {
        Service s = services.get(serviceId);
        if (s == null) throw new NoSuchElementException("Service " + serviceId + " not found");
        if ("stopped".equals(s.getStatus())) return s;
        s.setStatus("stopping");
        try {
            executeShutdown(s);
            s.setStatus("stopped");
            s.setStoppedAt(java.time.Instant.now());
            s.setUpdatedAt(java.time.Instant.now());
            log.info("Service stopped: {}", serviceId);
            return s;
        } catch (Exception e) {
            log.error("Failed to stop service {}", serviceId, e);
            throw e;
        }
    }

    public Service restartService(String serviceId) throws Exception {
        stopService(serviceId);
        return startService(serviceId);
    }

    public Service updateServiceConfig(String serviceId, Map<String, Object> newConfig) throws Exception {
        Service s = services.get(serviceId);
        if (s == null) throw new NoSuchElementException("Service " + serviceId + " not found");
        configManager.validate(newConfig);
        s.getConfig().putAll(newConfig);
        s.setUpdatedAt(java.time.Instant.now());
        log.info("Service config updated: {}", serviceId);
        // if running, reload config (noop default)
        if ("running".equals(s.getStatus())) reloadServiceConfig(serviceId);
        return s;
    }

    public Service getService(String serviceId) {
        return services.get(serviceId);
    }

    public List<Service> getAllServices() {
        return new ArrayList<>(services.values());
    }

    public void deleteService(String serviceId) throws Exception {
        Service s = services.get(serviceId);
        if (s == null) throw new NoSuchElementException("Service " + serviceId + " not found");
        if ("running".equals(s.getStatus())) stopService(serviceId);
        services.remove(serviceId);
        registry.unregister(serviceId);
        log.info("Service deleted: {}", serviceId);
    }

    public void startHealthChecks() {
        scheduler.scheduleAtFixedRate(() -> {
            for (Service s : services.values()) {
                if ("running".equals(s.getStatus())) {
                    try {
                        boolean healthy = healthCheck.check(s);
                        if (!healthy) {
                            int retries = (int) s.getConfig().getOrDefault("retries", 0);
                            if (retries < maxRetries) {
                                s.getConfig().put("retries", retries + 1);
                                log.warn("Service unhealthy, attempting restart: {} (retry={})", s.getId(), retries + 1);
                                try { restartService(s.getId()); } catch (Exception ex) { log.error("Restart failed for {}", s.getId(), ex); }
                            } else {
                                log.warn("Service {} exceeded max retries", s.getId());
                            }
                        }
                    } catch (Exception e) {
                        log.error("Health check failed for {}", s.getId(), e);
                    }
                }
            }
        }, checkIntervalMillis, checkIntervalMillis, TimeUnit.MILLISECONDS);
        log.info("Health checks scheduled every {} ms", checkIntervalMillis);
    }

    public void stopHealthChecks() {
        scheduler.shutdownNow();
        log.info("Health checks stopped");
    }

    protected void executeStartup(Service s) throws InterruptedException {
        // simulate startup delay
        Thread.sleep(100);
        s.setConfig(s.getConfig() == null ? new ConcurrentHashMap<>() : s.getConfig());
        s.getConfig().put("retries", 0);
    }

    protected void executeShutdown(Service s) throws InterruptedException {
        Thread.sleep(100);
    }

    protected void reloadServiceConfig(String serviceId) {
        // noop default - override as needed
    }

    public ServiceRegistry getRegistry() { return registry; }
}
