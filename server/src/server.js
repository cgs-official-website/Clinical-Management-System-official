import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import app from './app.js'
import { env } from './config/env.js'
import { pubsub, redis } from './config/redis.js'
import { prisma } from './config/prisma.js'
import { logger } from './utils/logger.js'

const server = http.createServer(app)

// Initialize WebSocket Server for Real-Time Permission Updates
const wss = new WebSocketServer({ server, path: '/ws/updates' })

// Map to track active client sockets: userId -> Set of WebSockets
const userSockets = new Map()

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const userId = url.searchParams.get('userId')

  if (userId) {
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set())
    }
    userSockets.get(userId).add(ws)
    logger.info(`WebSocket client connected for user: ${userId}`)
  } else {
    logger.info('Anonymous WebSocket client connected')
  }

  ws.on('close', () => {
    if (userId && userSockets.has(userId)) {
      userSockets.get(userId).delete(ws)
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId)
      }
    }
  })

  ws.on('error', (err) => {
    logger.warn(`WebSocket error: ${err.message}`)
  })
})

// Subscribe to Redis pub/sub for real-time permission cache invalidation
pubsub.subscribe('permissions:invalidate', (message) => {
  try {
    const data = typeof message === 'string' ? JSON.parse(message) : message
    logger.info('Received permissions:invalidate event from pub/sub', data)

    const broadcastPayload = JSON.stringify({
      event: 'PERMISSIONS_UPDATED',
      payload: data
    })

    if (data.type === 'INVALIDATE_USER' && data.userId) {
      // Send to specific user
      const sockets = userSockets.get(data.userId)
      if (sockets) {
        sockets.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastPayload)
          }
        })
      }
    } else if (data.type === 'INVALIDATE_ROLE' && Array.isArray(data.userIds)) {
      // Send to all users holding this role
      data.userIds.forEach((uid) => {
        const sockets = userSockets.get(uid)
        if (sockets) {
          sockets.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastPayload)
            }
          })
        }
      })
    } else {
      // Broadcast to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcastPayload)
        }
      })
    }
  } catch (err) {
    logger.error(`Error processing permissions:invalidate event: ${err.message}`)
  }
})

// Start server bound to 0.0.0.0 for cloud/container compatibility
server.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`🚀 clinic OS API running on http://0.0.0.0:${env.PORT}`)
  logger.info(`📑 Swagger API Docs available at http://0.0.0.0:${env.PORT}${env.API_PREFIX}/docs`)
  logger.info(`🔌 Real-time WebSocket endpoint at ws://0.0.0.0:${env.PORT}/ws/updates`)
})

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`)

  server.close(async () => {
    logger.info('HTTP & WebSocket server closed.')
    try {
      await prisma.$disconnect()
      logger.info('Prisma disconnected.')
    } catch (e) {
      // Ignore
    }
    process.exit(0)
  })

  // Force shutdown after 10s if hung
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export { server, app }
