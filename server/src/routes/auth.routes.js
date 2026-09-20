import { Router } from 'express'
import { z } from 'zod'
import { AuthController } from '../controllers/auth.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'
import { validateRequest } from '../middlewares/validate.middleware.js'
import { authLimiter } from '../middlewares/rateLimit.middleware.js'

const router = Router()

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  email: z.string().optional(),
  userId: z.string().optional(),
  isSuperadmin: z.boolean().optional(),
}).passthrough()

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required')
})

router.post('/login', authLimiter, validateRequest({ body: loginSchema }), AuthController.login)
router.post('/refresh', validateRequest({ body: refreshSchema }), AuthController.refresh)
router.post('/logout', AuthController.logout)
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), AuthController.forgotPassword)
router.get('/me', authenticateToken, AuthController.getMe)

export default router
