import { AsyncLocalStorage } from 'async_hooks'
import { UAParser } from 'ua-parser-js'

export const requestContext = new AsyncLocalStorage()

/**
 * Normalizes IPv4 / IPv6 addresses to standard readable format
 */
export const normalizeIp = (rawIp) => {
  if (!rawIp) return '-'
  let ip = String(rawIp).trim()
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1'
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '')
  return ip
}

/**
 * Parses userAgent string into a concise "Browser on OS" string
 */
export const formatDevice = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string' || userAgent.trim() === '') {
    return '-'
  }
  try {
    const parser = new UAParser(userAgent)
    const res = parser.getResult()
    const browser = res.browser.name || ''
    const os = res.os.name || ''
    if (browser && os) return `${browser} on ${os}`
    if (browser) return browser
    if (os) return os
    return '-'
  } catch {
    return '-'
  }
}

/**
 * Express middleware to track IP and User-Agent in AsyncLocalStorage
 */
export const requestContextMiddleware = (req, res, next) => {
  const forwarded = req.headers['x-forwarded-for']
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || req.ip || null)
  const ip = normalizeIp(rawIp)
  const userAgent = req.headers['user-agent'] || null

  const store = {
    ip,
    userAgent
  }

  requestContext.run(store, () => {
    next()
  })
}

export const getRequestContext = () => requestContext.getStore() || {}
