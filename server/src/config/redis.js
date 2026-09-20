import Redis from 'ioredis'
import { EventEmitter } from 'events'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

class MemoryRedisStore extends EventEmitter {
  constructor() {
    super()
    this.store = new Map()
    this.ttls = new Map()
  }

  async get(key) {
    const expiresAt = this.ttls.get(key)
    if (expiresAt && Date.now() > expiresAt) {
      this.store.delete(key)
      this.ttls.delete(key)
      return null
    }
    return this.store.get(key) || null
  }

  async set(key, value, mode, duration) {
    this.store.set(key, typeof value === 'string' ? value : JSON.stringify(value))
    if (mode === 'EX' && duration) {
      this.ttls.set(key, Date.now() + duration * 1000)
    } else {
      this.ttls.delete(key)
    }
    return 'OK'
  }

  async setex(key, seconds, value) {
    return this.set(key, value, 'EX', seconds)
  }

  async del(...keys) {
    let count = 0
    for (const key of keys.flat()) {
      if (this.store.has(key)) {
        this.store.delete(key)
        this.ttls.delete(key)
        count++
      }
    }
    return count
  }

  async keys(pattern = '*') {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    const matches = []
    const now = Date.now()
    for (const [key, exp] of this.ttls.entries()) {
      if (now > exp) {
        this.store.delete(key)
        this.ttls.delete(key)
      }
    }
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        matches.push(key)
      }
    }
    return matches
  }

  async publish(channel, message) {
    this.emit(`channel:${channel}`, message)
    return 1
  }

  async subscribe(channel, callback) {
    this.on(`channel:${channel}`, (msg) => {
      if (callback) callback(channel, msg)
      this.emit('message', channel, msg)
    })
    return 1
  }

  async flushall() {
    this.store.clear()
    this.ttls.clear()
    return 'OK'
  }
}

let redisClient
let redisSubscriber
let isMemoryFallback = false

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null // Stop retrying and fallback
      }
      return Math.min(times * 100, 1000)
    },
    reconnectOnError: () => false,
    lazyConnect: true
  })

  redisSubscriber = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true
  })

  redisClient.on('error', (err) => {
    if (!isMemoryFallback) {
      logger.warn(`Redis connection unavailable (${err.message}). Using resilient in-memory store.`)
      isMemoryFallback = true
    }
  })

  redisSubscriber.on('error', () => {})

  // Try initiating connection
  redisClient.connect().then(() => {
    logger.info('Connected to Redis server successfully')
    isMemoryFallback = false
  }).catch((err) => {
    logger.warn(`Redis connect error: ${err.message}. Falling back to in-memory store.`)
    isMemoryFallback = true
  })

} catch (err) {
  logger.warn(`Failed to initialize Redis client (${err.message}). Falling back to in-memory store.`)
  isMemoryFallback = true
}

const memoryStore = new MemoryRedisStore()

// Proxy to seamlessly delegate to Redis or Memory Store
export const redis = new Proxy({}, {
  get(target, prop) {
    if (isMemoryFallback || !redisClient || redisClient.status !== 'ready') {
      if (typeof memoryStore[prop] === 'function') {
        return memoryStore[prop].bind(memoryStore)
      }
      return memoryStore[prop]
    }
    if (typeof redisClient[prop] === 'function') {
      return async (...args) => {
        try {
          return await redisClient[prop](...args)
        } catch (err) {
          logger.warn(`Redis ${String(prop)} failed: ${err.message}. Routing to fallback store.`)
          isMemoryFallback = true
          if (typeof memoryStore[prop] === 'function') {
            return memoryStore[prop](...args)
          }
        }
      }
    }
    return redisClient[prop]
  }
})

export const pubsub = {
  publish: async (channel, message) => {
    const payload = typeof message === 'string' ? message : JSON.stringify(message)
    try {
      if (!isMemoryFallback && redisClient && redisClient.status === 'ready') {
        await redisClient.publish(channel, payload)
      }
    } catch (e) {
      logger.warn(`Redis publish error: ${e.message}`)
    }
    // Also broadcast to local listeners
    memoryStore.publish(channel, payload)
  },
  subscribe: async (channel, callback) => {
    try {
      if (!isMemoryFallback && redisSubscriber && redisSubscriber.status === 'ready') {
        await redisSubscriber.subscribe(channel)
        redisSubscriber.on('message', (ch, msg) => {
          if (ch === channel) callback(msg)
        })
      }
    } catch (e) {
      logger.warn(`Redis subscribe error: ${e.message}`)
    }
    memoryStore.on(`channel:${channel}`, (msg) => callback(msg))
  }
}

export default redis
