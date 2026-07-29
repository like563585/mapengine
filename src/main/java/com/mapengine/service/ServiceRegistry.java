package com.mapengine.service;

import lombok.extern.slf4j.Slf4j;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.stream.Collectors;

@Slf4j
public class ServiceRegistry {
    private final Map<String, Service> services = new java.util.concurrent.ConcurrentHashMap<>();
    private final Set<java.util.function.BiConsumer<String, Service>> subscribers = new CopyOnWriteArraySet<>();

    public void register(String serviceId, Service service) {
        services.put(serviceId, service);
        notifySubscribers("service:registered", service);
        log.info("Service registered: {}", serviceId);
    }

    public void unregister(String serviceId) {
        services.remove(serviceId);
        notifySubscribers("service:unregistered", null);
        log.info("Service unregistered: {}", serviceId);
    }

    public Service get(String serviceId) { return services.get(serviceId); }

    public java.util.List<Service> query(Map<String, Object> criteria) {
        return services.values().stream().filter(s -> matches(s, criteria)).collect(Collectors.toList());
    }

    public boolean matches(Service s, Map<String, Object> criteria) {
        if (criteria == null || criteria.isEmpty()) return true;
        if (criteria.containsKey("type") && !criteria.get("type").equals(s.getType())) return false;
        if (criteria.containsKey("status") && !criteria.get("status").equals(s.getStatus())) return false;
        if (criteria.containsKey("name") && !s.getName().contains(String.valueOf(criteria.get("name")))) return false;
        return true;
    }

    public java.util.List<Service> getAll() { return new java.util.ArrayList<>(services.values()); }

    public void subscribe(java.util.function.BiConsumer<String, Service> subscriber) { subscribers.add(subscriber); }

    public void unsubscribe(java.util.function.BiConsumer<String, Service> subscriber) { subscribers.remove(subscriber); }

    private void notifySubscribers(String event, Service service) {
        for (var sub : subscribers) {
            try { sub.accept(event, service); } catch (Exception e) { log.warn("Subscriber threw", e); }
        }
    }

    public java.util.Map<String, Object> getStats() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("total", services.size());
        return stats;
    }
}
