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

function generateClinicalAssistantFallback(message) {
  const lower = (message || '').toLowerCase()

  if (lower.includes('what is zuna') || lower.includes('about zuna') || lower.includes('zuna meaning') || lower.includes('who are you') || lower.includes('what does zuna')) {
    return `### What is ZUNA?
**ZUNA** (Zuna Clinical OS) is an enterprise-grade AI-powered **Clinical Management System (CMS) & Healthcare ERP** designed to unify hospital operations, clinical consultations, patient records, and medical administration.

#### Key Modules & Capabilities:
- **Dynamic Multi-Tenant RBAC:** Role matrices with granular module permissions (\`view\`, \`create\`, \`edit\`, \`approve\`) and real-time permission synchronization.
- **Electronic Health Records (EHR):** Comprehensive patient charts, vital signs history, consultation encounters, and medical records.
- **Intelligent Provider Scheduling:** Multi-provider calendars, automated conflict detection, and slot booking.
- **Prescriptions & Pharmacy:** e-Prescribing with automated drug interaction screening, CDSCO schedule tracking, and batch inventory management.
- **Billing & Revenue Cycle:** Co-pay calculations, CPT/ICD-10 invoicing, claims generation, and payment gateway integration.
- **Telehealth & Telemetry:** Integrated video consultation links and live WebSocket metric synchronization.

*How can I assist you with your clinical operations today?*`
  }

  if (lower.includes('schedule') || lower.includes('appointment') || lower.includes('booking')) {
    return `### Intelligent Scheduling in ZUNA
In ZUNA, appointments and provider schedules are managed via the **Scheduling Engine**:
- **Book Appointments:** Navigate to **Appointments**, select the clinic branch, provider specialty, available time slot, and patient.
- **Multi-Provider Timeline:** View provider availability side-by-side to avoid overlapping schedules.
- **Encounter Conversion:** Once a patient checks in, their appointment directly links to an active EHR consultation encounter.

Would you like assistance navigating appointments or managing provider time-slots?`
  }

  if (lower.includes('bill') || lower.includes('invoice') || lower.includes('payment') || lower.includes('insurance') || lower.includes('claim')) {
    return `### Billing & Claims Management in ZUNA
ZUNA streamlines the healthcare revenue cycle:
- **Invoice Generation:** Automatically populates consultation fees, procedure charges, and pharmacy orders.
- **Co-Pay & Deductibles:** Calculates patient out-of-pocket responsibilities versus insurance covered portions.
- **Claims Submission:** Exports compliant claims with CPT and ICD-10 diagnostic codes.
- **Real-Time Status:** Tracks unpaid, partial, paid, and disputed invoices.`
  }

  if (lower.includes('role') || lower.includes('permission') || lower.includes('rbac') || lower.includes('access')) {
    return `### Dynamic Role-Based Access Control (RBAC)
ZUNA supports customizable role templates:
- **Granular Permissions:** Configure permissions per module (Patients, Appointments, Prescriptions, Billing, Pharmacy, Inventory, Reports).
- **Action Levels:** Control \`view\`, \`create\`, \`edit\`, and \`approve\` privileges independently.
- **Live Sync:** Security policies are propagated in real-time across active staff sessions.`
  }

  if (lower.includes('blood pressure') || lower.includes('hypertension') || lower.includes('sugar') || lower.includes('diabetes') || lower.includes('vital')) {
    return `### Clinical Vitals Reference & Guidelines
- **Blood Pressure (Adults):**
  - Normal: < 120/80 mmHg
  - Elevated: 120–129 / < 80 mmHg
  - Stage 1 Hypertension: 130–139 / 80–89 mmHg
  - Stage 2 Hypertension: ≥ 140 / ≥ 90 mmHg
  - Hypertensive Crisis: > 180 / > 120 mmHg *(Requires immediate emergency medical attention)*
- **Oxygen Saturation (SpO2):** Normal range is 95%–100%. SpO2 < 92% requires urgent clinical evaluation.

> *Disclaimer: This information is for clinical educational purposes only and does not substitute professional medical advice, diagnosis, or treatment. Consult a licensed physician for clinical decisions.*`
  }

  if (lower.includes('prescription') || lower.includes('medicine') || lower.includes('drug') || lower.includes('pharmacy')) {
    return `### Pharmacy & Prescription Management
ZUNA provides active pharmacovigilance tools:
- **Drug-Drug Interaction Screening:** Flags potential contraindications during order entry.
- **Patient Allergy Cross-Checking:** Alerts clinicians to drug class sensitivities (e.g., Penicillin, NSAIDs).
- **Inventory & Batch Tracking:** Tracks batch expiration dates and regulatory CDSCO drug schedules.

> *Disclaimer: Clinical staff must verify all prescriptions before dispensing.*`
  }

  // General clinical assistant fallback response
  return `### ZUNA Clinical Assistant
I am the AI Assistant for **ZUNA Clinical OS**. I can assist you with:
- **Clinical Workflows:** Managing patient records, appointment scheduling, and consultation documentation.
- **Pharmacy & Prescriptions:** Interaction alerts, batch stock tracking, and medication orders.
- **ERP Administration:** Configuring role permissions, categories, billing, and system metrics.
- **Clinical Information:** General medical and vitals reference.

How can I assist your practice today?

> *Disclaimer: This information is for educational purposes only and does not substitute professional medical advice, diagnosis, or treatment.*`
}

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

    const apiKey = (env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '').trim()
    
    // If no API key configured, seamlessly respond with built-in Clinical OS assistant
    if (!apiKey) {
      logger.info('OpenRouter API key is not configured. Using built-in Clinical Assistant fallback.')
      const reply = generateClinicalAssistantFallback(message)
      return res.status(200).json({
        success: true,
        reply,
        model: 'clinical-assistant-built-in',
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
    let authFailed = false

    // Try primary model, fall back to alternatives if rate-limited or unavailable
    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
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

          // If 401 Unauthorized, key is revoked or deleted ("User not found")
          if (response.status === 401) {
            authFailed = true
            logger.warn(
              `[OpenRouter] Authentication failed (401: Invalid API Key). Please update OPENROUTER_API_KEY in server/.env with a valid key from https://openrouter.ai/keys.`
            )
            break // No point trying remaining models with the same invalid key
          }
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
      }
    }

    if (responseData) {
      return res.status(200).json({
        success: true,
        reply: responseData.reply,
        model: responseData.modelUsed,
      })
    }

    // Graceful fallback: If OpenRouter is 401, offline, or unavailable, respond intelligently
    logger.info(`Activating Clinical Assistant fallback response (authFailed=${authFailed}).`)
    const fallbackReply = generateClinicalAssistantFallback(message)

    return res.status(200).json({
      success: true,
      reply: fallbackReply,
      model: authFailed ? 'clinical-assistant-offline-auth-fallback' : 'clinical-assistant-fallback',
    })
  } catch (error) {
    logger.error(`Chat controller error: ${error.message}`)
    next(error)
  }
}

