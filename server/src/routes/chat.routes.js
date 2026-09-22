import { Router } from 'express'
import { handleChat } from '../controllers/chat.controller.js'

const router = Router()

// POST /api/chat - Send message to OpenRouter AI chatbot
router.post('/', handleChat)

export default router
