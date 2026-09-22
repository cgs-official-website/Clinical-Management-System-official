import { prisma } from '../config/prisma.js'
import { logger } from '../utils/logger.js'

export class NotificationService {
  /**
   * Create a new notification in PostgreSQL
   */
  static async createNotification({
    userId = null,
    type = 'CLINIC_REGISTRATION_PENDING',
    title,
    message,
    entityType = 'REGISTRATION',
    entityId = null,
    data = null,
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          entityType,
          entityId,
          data,
        },
      })
      logger.info(`✅ Created notification record in PostgreSQL: ${notification.id}`)
      return notification
    } catch (error) {
      logger.error('Failed to create notification in PostgreSQL:', error)
      return null
    }
  }

  /**
   * Get all notifications for Superadmin
   */
  static async getSuperadminNotifications({ limit = 50 } = {}) {
    try {
      const notifications = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      const unreadCount = notifications.filter((n) => !n.isRead).length

      return {
        notifications,
        unreadCount,
        total: notifications.length,
      }
    } catch (error) {
      logger.error('Failed to fetch superadmin notifications from PostgreSQL:', error)
      return { notifications: [], unreadCount: 0, total: 0 }
    }
  }

  /**
   * Mark a single notification as read in PostgreSQL
   */
  static async markAsRead(id) {
    try {
      const updated = await prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
      return updated
    } catch (error) {
      logger.error(`Failed to mark notification ${id} as read in PostgreSQL:`, error)
      throw error
    }
  }

  /**
   * Mark all notifications as read in PostgreSQL
   */
  static async markAllAsRead() {
    try {
      const updated = await prisma.notification.updateMany({
        where: { isRead: false },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
      return updated
    } catch (error) {
      logger.error('Failed to mark all notifications as read in PostgreSQL:', error)
      throw error
    }
  }
}
