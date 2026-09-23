import { Router } from 'express'
import { PublicController } from '../controllers/public.controller.js'
import { SubscriptionController } from '../controllers/subscription.controller.js'

const router = Router()

router.get('/public/site-content', PublicController.getSiteContent)
router.get('/public/subscription-plans', SubscriptionController.getPublicPlans)
router.get('/subscription-plans', SubscriptionController.getPublicPlans)
router.get('/public/clinic-categories', PublicController.getClinicCategories)
router.get('/clinic-categories', PublicController.getClinicCategories)
router.post('/public/register', PublicController.registerClinic)
router.post('/public/register-clinic', PublicController.registerClinic)
router.post('/register-clinic', PublicController.registerClinic)
router.post('/public/register-staff', PublicController.registerStaff)
router.get('/public/registration-status/:id', PublicController.getRegistrationStatus)
router.post('/public/newsletter', PublicController.subscribeNewsletter)
router.post('/public/demo-request', PublicController.requestDemo)
router.get('/health', PublicController.getHealth)
router.get('/public/health', PublicController.getHealth)

export default router
