/**
 * Simple in-memory cache for frequently accessed data
 * Helps reduce database queries for static/slow-changing data
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each key
  }

  set(key, value, ttlMs = 300000) { // Default 5 minutes TTL
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
    return value;
  }

  get(key) {
    // Check if key exists and hasn't expired
    if (this.cache.has(key)) {
      const expiryTime = this.ttl.get(key);
      if (Date.now() < expiryTime) {
        return this.cache.get(key);
      } else {
        // Expired, remove from cache
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    const validEntries = Array.from(this.ttl.entries())
      .filter(([key, expiry]) => expiry > now);
    
    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length
    };
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (expiry <= now) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }
}

// Create singleton instance
const cache = new SimpleCache();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

// Cache keys for different data types
export const CACHE_KEYS = {
  CATEGORIES: 'categories_all',
  TAGS: 'tags_all',
  USER_STATS: 'user_stats',
  DASHBOARD_STATS: 'dashboard_stats',
  RECENT_TICKETS: 'recent_tickets',
  TICKET_ANALYTICS: 'ticket_analytics'
};

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  CATEGORIES: 30 * 60 * 1000,    // 30 minutes (rarely change)
  TAGS: 30 * 60 * 1000,         // 30 minutes (rarely change)  
  USER_STATS: 5 * 60 * 1000,    // 5 minutes
  DASHBOARD_STATS: 2 * 60 * 1000, // 2 minutes (needs to be fresh)
  RECENT_TICKETS: 1 * 60 * 1000,  // 1 minute (frequently updated)
  TICKET_ANALYTICS: 5 * 60 * 1000 // 5 minutes
};

export default cache;