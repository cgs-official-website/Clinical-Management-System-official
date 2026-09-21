import { Router } from 'express'
import { AiController } from '../controllers/ai.controller.js'
import { authenticateToken } from '../middlewares/auth.middleware.js'

const router = Router()

// Public status check for AI engine
router.get('/status', AiController.getStatus)

// Authenticated AI capabilities
router.use(authenticateToken)

// Superadmin / Category Engine
router.post('/category-plan', AiController.generateCategoryPlan)
router.post('/category-autoprovision', AiController.autoprovisionCategory)

// Clinical Decision Support & Triage
router.post('/triage', AiController.analyzeTriage)
router.post('/consultation', AiController.consultationAssist)
router.post('/prescription-review', AiController.reviewPrescriptionSafety)

export default router
