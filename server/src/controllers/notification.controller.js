import { NotificationService } from '../services/notification.service.js'

export class NotificationController {
  /**
   * Get Superadmin notifications from PostgreSQL
   */
  static async getNotifications(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50
      const data = await NotificationService.getSuperadminNotifications({ limit })
      return res.status(200).json({
        success: true,
        data: data.notifications,
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        total: data.total,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Mark a notification as read in PostgreSQL
   */
  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params
      const updated = await NotificationService.markAsRead(id)
      return res.status(200).json({
        success: true,
        message: 'Notification marked as read in PostgreSQL database',
        data: updated,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Mark all notifications as read in PostgreSQL
   */
  static async markAllAsRead(req, res, next) {
    try {
      await NotificationService.markAllAsRead()
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read in PostgreSQL database',
      })
    } catch (error) {
      next(error)
    }
  }
}
