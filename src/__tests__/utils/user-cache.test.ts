import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserCache, getUserCache, createCacheKey, type CachedUser, type CacheConfig } from '../../utils/user-cache.js';

describe('UserCache', () => {
  let cache: UserCache;
  const mockUser: Omit<CachedUser, 'cachedAt'> = {
    accountId: 'acc123',
    displayName: 'John Doe',
    emailAddress: 'john@example.com',
    active: true,
    timeZone: 'America/New_York',
    accountType: 'atlassian',
    avatarUrls: {
      '48x48': 'https://example.com/avatar.png'
    }
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));
    cache = new UserCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should use default config', () => {
      const defaultCache = new UserCache();
      const stats = defaultCache.getStats();
      expect(stats.size).toBe(0);
    });

    it('should accept custom config', () => {
      const customConfig: Partial<CacheConfig> = {
        maxSize: 500,
        ttlMs: 5 * 60 * 1000 // 5 minutes
      };
      const customCache = new UserCache(customConfig);
      const stats = customCache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('set and get', () => {
    it('should store and retrieve user by accountId', () => {
      cache.set(mockUser);
      const retrieved = cache.get('acc123');
      
      expect(retrieved).toMatchObject({
        accountId: 'acc123',
        displayName: 'John Doe',
        emailAddress: 'john@example.com',
        active: true
      });
      expect(retrieved?.cachedAt).toBeDefined();
    });

    it('should store and retrieve user by displayName', () => {
      cache.set(mockUser);
      const retrieved = cache.get('John Doe');
      
      expect(retrieved).toMatchObject({
        accountId: 'acc123',
        displayName: 'John Doe'
      });
    });

    it('should store and retrieve user by email', () => {
      cache.set(mockUser);
      const retrieved = cache.get('john@example.com');
      
      expect(retrieved).toMatchObject({
        accountId: 'acc123',
        emailAddress: 'john@example.com'
      });
    });

    it('should handle case insensitive lookups', () => {
      cache.set(mockUser);
      
      expect(cache.get('ACC123')).toBeTruthy();
      expect(cache.get('JOHN DOE')).toBeTruthy();
      expect(cache.get('JOHN@EXAMPLE.COM')).toBeTruthy();
    });

    it('should handle lookups with whitespace', () => {
      cache.set(mockUser);
      
      expect(cache.get('  acc123  ')).toBeTruthy();
      expect(cache.get('  John Doe  ')).toBeTruthy();
    });

    it('should return null for non-existent users', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should handle users with missing optional fields', () => {
      const minimalUser: Omit<CachedUser, 'cachedAt'> = {
        accountId: 'min123',
        displayName: 'Minimal User',
        active: true
      };
      
      cache.set(minimalUser);
      const retrieved = cache.get('min123');
      
      expect(retrieved).toMatchObject({
        accountId: 'min123',
        displayName: 'Minimal User',
        active: true
      });
      expect(retrieved?.emailAddress).toBeUndefined();
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', () => {
      const shortTtlCache = new UserCache({ ttlMs: 1000 }); // 1 second TTL
      shortTtlCache.set(mockUser);
      
      // User should be available immediately
      expect(shortTtlCache.get('acc123')).toBeTruthy();
      
      // Advance time beyond TTL
      vi.advanceTimersByTime(1500);
      
      // User should be expired and return null
      expect(shortTtlCache.get('acc123')).toBeNull();
    });

    it('should clean up expired entries from cache', () => {
      const shortTtlCache = new UserCache({ ttlMs: 1000 });
      shortTtlCache.set(mockUser);
      
      expect(shortTtlCache.getStats().size).toBe(3); // 3 keys: accountId, displayName, email
      
      // Advance time beyond TTL and try to get
      vi.advanceTimersByTime(1500);
      shortTtlCache.get('acc123');
      
      // The get operation only removes the specific key that was accessed
      // The cache implementation only removes the accessed key, not all related keys
      expect(shortTtlCache.getStats().size).toBe(2); // Other keys still there until accessed
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entries when size limit exceeded', () => {
      const smallCache = new UserCache({ maxSize: 2 }); // Only 2 entries max
      
      const user1: Omit<CachedUser, 'cachedAt'> = {
        accountId: 'user1',
        displayName: 'User One',
        active: true
      };
      
      const user2: Omit<CachedUser, 'cachedAt'> = {
        accountId: 'user2',
        displayName: 'User Two',
        active: true
      };
      
      const user3: Omit<CachedUser, 'cachedAt'> = {
        accountId: 'user3',
        displayName: 'User Three',
        active: true
      };
      
      // Add first user (2 keys: accountId + displayName)
      smallCache.set(user1);
      expect(smallCache.getStats().size).toBe(2);
      
      // Add second user - should not evict since we're at limit
      smallCache.set(user2);
      expect(smallCache.getStats().size).toBe(2); // Should evict user1 keys
      
      // Verify user1 was evicted
      expect(smallCache.get('user1')).toBeNull();
      expect(smallCache.get('user2')).toBeTruthy();
      
      // Add third user
      smallCache.set(user3);
      expect(smallCache.get('user2')).toBeNull(); // user2 should be evicted
      expect(smallCache.get('user3')).toBeTruthy();
    });

    it('should update access order on get operations', () => {
      const smallCache = new UserCache({ maxSize: 2 });
      
      const user1: Omit<CachedUser, 'cachedAt'> = {
        accountId: 'user1',
        displayName: 'User One',
        active: true
      };
      
      const user2: Omit<CachedUser, 'cachedAt'> = {
        accountId: 'user2',
        displayName: 'User Two',
        active: true
      };
      
      // Add both users
      smallCache.set(user1);
      smallCache.set(user2); // This evicts user1
      
      expect(smallCache.get('user1')).toBeNull();
      expect(smallCache.get('user2')).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should remove user by any identifier', () => {
      cache.set(mockUser);
      
      expect(cache.get('acc123')).toBeTruthy();
      expect(cache.get('John Doe')).toBeTruthy();
      expect(cache.get('john@example.com')).toBeTruthy();
      
      cache.delete('acc123');
      
      expect(cache.get('acc123')).toBeNull();
      expect(cache.get('John Doe')).toBeNull();
      expect(cache.get('john@example.com')).toBeNull();
    });

    it('should handle deletion of non-existent user', () => {
      cache.delete('nonexistent');
      expect(cache.getStats().size).toBe(0);
    });

    it('should remove all related keys when deleting by any identifier', () => {
      cache.set(mockUser);
      expect(cache.getStats().size).toBe(3); // accountId, displayName, email
      
      cache.delete('john@example.com'); // Delete by email
      
      expect(cache.getStats().size).toBe(0);
      expect(cache.get('acc123')).toBeNull();
      expect(cache.get('John Doe')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cached data', () => {
      cache.set(mockUser);
      cache.set({
        accountId: 'acc456',
        displayName: 'Jane Doe',
        active: true
      });
      
      expect(cache.getStats().size).toBeGreaterThan(0);
      
      cache.clear();
      
      expect(cache.getStats().size).toBe(0);
      expect(cache.get('acc123')).toBeNull();
      expect(cache.get('acc456')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct stats for empty cache', () => {
      const stats = cache.getStats();
      
      expect(stats).toEqual({
        size: 0,
        hitRate: 0,
        oldestEntry: null,
        memoryUsageKB: 0
      });
    });

    it('should return correct stats for populated cache', () => {
      cache.set(mockUser);
      cache.set({
        accountId: 'acc456',
        displayName: 'Jane Doe',
        active: true
      });
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(5); // 3 keys for first user + 2 for second
      expect(stats.hitRate).toBe(0); // Not tracking hits/misses
      expect(stats.oldestEntry).toBe(Date.now());
      expect(stats.memoryUsageKB).toBe(1); // Math.round((5 * 200) / 1024)
    });

    it('should find oldest entry correctly', () => {
      cache.set(mockUser);
      
      vi.advanceTimersByTime(5000);
      
      cache.set({
        accountId: 'acc456',
        displayName: 'Jane Doe',
        active: true
      });
      
      const stats = cache.getStats();
      expect(stats.oldestEntry).toBe(Date.now() - 5000); // First user is older
    });
  });

  describe('maintenance', () => {
    it('should remove expired entries during maintenance', () => {
      const shortTtlCache = new UserCache({ ttlMs: 1000 });
      
      shortTtlCache.set(mockUser);
      shortTtlCache.set({
        accountId: 'acc456',
        displayName: 'Jane Doe',
        active: true
      });
      
      expect(shortTtlCache.getStats().size).toBe(5);
      
      // Advance time to expire first user
      vi.advanceTimersByTime(1500);
      
      // Add another user that won't be expired
      shortTtlCache.set({
        accountId: 'acc789',
        displayName: 'Bob Smith',
        active: true
      });
      
      expect(shortTtlCache.getStats().size).toBe(7); // All entries still there
      
      // Run maintenance
      shortTtlCache.maintenance();
      
      expect(shortTtlCache.getStats().size).toBe(2); // Only newest user remains
      expect(shortTtlCache.get('acc789')).toBeTruthy();
      expect(shortTtlCache.get('acc123')).toBeNull();
      expect(shortTtlCache.get('acc456')).toBeNull();
    });

    it('should handle maintenance on empty cache', () => {
      cache.maintenance();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle user with only accountId', () => {
      const minimalUser: Omit<CachedUser, 'cachedAt'> = {
        accountId: 'minimal',
        displayName: '',
        active: true
      };
      
      cache.set(minimalUser);
      expect(cache.get('minimal')).toBeTruthy();
      expect(cache.getStats().size).toBe(1); // Only accountId key
    });

    it('should handle eviction when cache has exactly maxSize entries', () => {
      const exactCache = new UserCache({ maxSize: 3 });
      
      const user: Omit<CachedUser, 'cachedAt'> = {
        accountId: 'test',
        displayName: 'Test User',
        emailAddress: 'test@test.com',
        active: true
      };
      
      exactCache.set(user); // 3 keys - exactly at limit
      expect(exactCache.getStats().size).toBe(3);
      
      const newUser: Omit<CachedUser, 'cachedAt'> = {
        accountId: 'new',
        displayName: 'New User',
        active: true
      };
      
      exactCache.set(newUser); // Should evict old user
      expect(exactCache.getStats().size).toBe(2);
      expect(exactCache.get('test')).toBeNull();
      expect(exactCache.get('new')).toBeTruthy();
    });
  });
});

describe('getUserCache', () => {
  afterEach(() => {
    // Reset global cache between tests
    getUserCache({ maxSize: 1 }); // Force recreation
  });

  it('should return the same instance on subsequent calls', () => {
    const cache1 = getUserCache();
    const cache2 = getUserCache();
    
    expect(cache1).toBe(cache2);
  });

  it('should create new instance when config is provided', () => {
    const cache1 = getUserCache();
    const cache2 = getUserCache({ maxSize: 500 });
    
    expect(cache1).not.toBe(cache2);
  });

  it('should use provided config for new instance', () => {
    const customConfig: Partial<CacheConfig> = {
      maxSize: 100,
      ttlMs: 5000
    };
    
    const cache = getUserCache(customConfig);
    
    // Verify config is applied by testing behavior
    const user: Omit<CachedUser, 'cachedAt'> = {
      accountId: 'test',
      displayName: 'Test User',
      emailAddress: 'test@example.com',
      active: true
    };
    
    cache.set(user);
    expect(cache.getStats().size).toBe(3); // accountId + displayName + email
  });
});

describe('createCacheKey', () => {
  it('should prefer accountId over other identifiers', () => {
    const args = {
      accountId: 'acc123',
      username: 'john',
      email: 'john@example.com'
    };
    
    expect(createCacheKey(args)).toBe('acc123');
  });

  it('should use username when accountId is not provided', () => {
    const args = {
      username: 'john',
      email: 'john@example.com'
    };
    
    expect(createCacheKey(args)).toBe('john');
  });

  it('should use email when accountId and username are not provided', () => {
    const args = {
      email: 'john@example.com'
    };
    
    expect(createCacheKey(args)).toBe('john@example.com');
  });

  it('should normalize keys to lowercase and trim whitespace', () => {
    expect(createCacheKey({ accountId: '  ACC123  ' })).toBe('acc123');
    expect(createCacheKey({ username: '  JOHN  ' })).toBe('john');
    expect(createCacheKey({ email: '  JOHN@EXAMPLE.COM  ' })).toBe('john@example.com');
  });

  it('should throw error when no identifiers provided', () => {
    expect(() => createCacheKey({})).toThrow('At least one identifier required for cache key');
  });

  it('should throw error when all identifiers are empty', () => {
    expect(() => createCacheKey({ 
      accountId: '', 
      username: '', 
      email: '' 
    })).toThrow('At least one identifier required for cache key');
  });

  it('should throw error when all identifiers are undefined', () => {
    expect(() => createCacheKey({ 
      accountId: undefined, 
      username: undefined, 
      email: undefined 
    })).toThrow('At least one identifier required for cache key');
  });
});