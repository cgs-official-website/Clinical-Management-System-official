import { AuthService } from '../services/auth.service.js'
import { RbacService } from '../services/rbac.service.js'

export class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body
      const userAgent = req.headers['user-agent'] || ''
      const ipAddress = req.ip || req.connection.remoteAddress || ''

      const result = await AuthService.login(email, password, { userAgent, ipAddress })

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  static async refresh(req, res, next) {
    try {
      const { refreshToken, email, userId, isSuperadmin } = req.body
      const userAgent = req.headers['user-agent'] || ''
      const ipAddress = req.ip || req.connection.remoteAddress || ''

      const tokens = await AuthService.refreshTokens(refreshToken, {
        userAgent,
        ipAddress,
        email,
        userId,
        isSuperadmin,
      })

      return res.status(200).json({
        success: true,
        data: tokens,
        ...tokens,
      })
    } catch (error) {
      next(error)
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body
      await AuthService.logout(refreshToken)

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async getMe(req, res, next) {
    try {
      const targetId = req.user?.id || req.user?.email
      const userProfile = await AuthService.getCurrentUser(targetId)

      return res.status(200).json({
        success: true,
        data: userProfile
      })
    } catch (error) {
      next(error)
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body
      // Demo password reset acknowledgement
      return res.status(200).json({
        success: true,
        message: `If an account with ${email} exists, password reset instructions have been dispatched.`
      })
    } catch (error) {
      next(error)
    }
  }
}

export default AuthController
