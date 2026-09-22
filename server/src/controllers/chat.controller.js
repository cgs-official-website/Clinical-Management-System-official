import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const SYSTEM_PROMPT = `You are the official AI Assistant for ZUNA (also known as Zuna Health Systems / Zuna Clinical OS), a Next-Gen AI-Powered Clinical Management System application.

Your capabilities and guardrails are:
1. ZUNA CLINICAL MANAGEMENT SYSTEM ASSISTANCE:
   - ZUNA is the name of this Clinical Management System application.
   - When asked "What is ZUNA?", "What does ZUNA mean?", or similar questions, explain that ZUNA is this enterprise Clinical Management System designed to unify healthcare operations, patient care, scheduling, permissions, and billing.
   - Never say ZUNA is an unknown term, and do not guess unrelated external companies, products, or dictionary definitions.
   - Answer questions about ZUNA features based strictly on actual existing capabilities in this project:
     * Dynamic Multi-Tenant RBAC & Role Management (custom role matrices, granular permissions, merged effective roles).
     * Electronic Health Records (EHR) & Patient Charts (vitals history, encounter notes, medical records).
     * Intelligent Multi-Provider Scheduling Engine (calendar timelines, slot booking, drag-and-drop rescheduling).
     * Prescriptions & Pharmacy Pipeline (Rx creation, drug interaction alerts, ICD-10 coding, batch inventory tracking).
     * Automated Billing & Claims (co-pay calculation, CPT invoices, claims generation, payment tracking).
     * Real-time Observability & Telehealth (Redis pub/sub metrics, WebRTC video consultation links, exportable audit logs).
   - Do NOT invent or fabricate features that are not present in this project.

2. GENERAL HEALTH & MEDICAL EDUCATION:
   - Answer general medical, health, wellness, and preventive care questions safely and accurately.
   - NEVER diagnose patients or prescribe specific medications, dosages, or treatments.
   - If asked for a diagnosis or prescription, politely explain that you cannot diagnose or prescribe, and advise consulting a qualified healthcare professional.
   - Always include a standard medical disclaimer when providing health information: "Disclaimer: This information is for educational purposes only and does not substitute professional medical advice, diagnosis, or treatment."

3. STYLE & FORMAT:
   - Keep answers clear, concise, professional, and well-structured using markdown formatting (bullet points, bold text).`

export const handleChat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message text is required.',
        },
      })
    }

    const apiKey = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      logger.warn('OpenRouter API key is missing in environment configuration.')
      return res.status(500).json({
        success: false,
        error: {
          code: 'OPENROUTER_KEY_MISSING',
          message: 'OpenRouter API key is not configured on the server.',
        },
      })
    }

    const preferredModel = env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || 'openrouter/auto'
    const fallbackModels = [
      preferredModel,
      'openrouter/auto',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001',
      'deepseek/deepseek-r1-distill-llama-70b'
    ]

    // Deduplicate models while keeping order
    const modelsToTry = Array.from(new Set(fallbackModels))

    // Format conversation history safely
    const formattedHistory = Array.isArray(history)
      ? history
          .filter((msg) => msg && typeof msg.content === 'string' && (msg.role === 'user' || msg.role === 'assistant'))
          .map((msg) => ({
            role: msg.role,
            content: msg.content.trim(),
          }))
          .slice(-10) // keep last 10 messages for context window
      : []

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...formattedHistory,
      { role: 'user', content: message.trim() },
    ]

    let responseData = null
    let lastError = null

    // Try primary model, fall back to alternatives if rate-limited or unavailable
    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'HTTP-Referer': 'http://localhost:5001',
            'X-Title': 'Clinical Management System',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 1000,
            temperature: 0.7,
          }),
        })

        if (!response.ok) {
          const errBody = await response.text()
          logger.warn(`OpenRouter model ${model} failed with status ${response.status}: ${errBody}`)
          lastError = `OpenRouter API error (${response.status})`
          continue
        }

        const data = await response.json()
        const reply = data.choices?.[0]?.message?.content

        if (reply) {
          responseData = { reply, modelUsed: model }
          break
        }
      } catch (err) {
        logger.error(`Error connecting to OpenRouter model ${model}: ${err.message}`)
        lastError = err.message
      }
    }

    if (!responseData) {
      return res.status(502).json({
        success: false,
        error: {
          code: 'OPENROUTER_SERVICE_ERROR',
          message: lastError || 'Failed to generate response from OpenRouter AI service.',
        },
      })
    }

    return res.status(200).json({
      success: true,
      reply: responseData.reply,
      model: responseData.modelUsed,
    })
  } catch (error) {
    logger.error(`Chat controller error: ${error.message}`)
    next(error)
  }
}
