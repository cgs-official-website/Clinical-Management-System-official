import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

const SYSTEM_PROMPT = `You are the official AI Assistant for ZUNA (also known as Zuna Health Systems / Zuna Clinical OS), a Next-Gen AI-Powered Clinical Management System application.

Your capabilities and guardrails are:
1. ZUNA CLINICAL MANAGEMENT SYSTEM ASSISTANCE:
   - ZUNA is the name of this Clinical Management System application.
   - When asked "What is ZUNA?", "What does ZUNA mean?", or similar questions, explain that ZUNA is this enterprise Clinical Management System designed to unify healthcare operations, patient care, scheduling, permissions, and billing.
   - Answer questions about ZUNA features based strictly on actual existing capabilities in this project:
     * Dynamic Multi-Tenant RBAC & Role Management (custom role matrices, granular permissions, merged effective roles).
     * Electronic Health Records (EHR) & Patient Charts (vitals history, encounter notes, medical records).
     * Intelligent Multi-Provider Scheduling Engine (calendar timelines, slot booking, drag-and-drop rescheduling).
     * Prescriptions & Pharmacy Pipeline (Rx creation, drug interaction alerts, ICD-10 coding, batch inventory tracking).
     * Automated Billing & Claims (co-pay calculation, CPT invoices, claims generation, payment tracking).
     * Real-time Observability & Telehealth (Redis pub/sub metrics, WebRTC video consultation links, exportable audit logs).
   - Portals: ZUNA features 3 main role-protected application portals (Superadmin Portal at /app/superadmin, Clinic Admin Portal at /app/admin, Staff & Clinical Portal at /app/staff) plus a Public Portal at /.
   - Do NOT invent or fabricate features that are not present in this project.

2. GENERAL HEALTH & MEDICAL EDUCATION:
   - Answer general medical, health, wellness, and preventive care questions safely and accurately.
   - NEVER diagnose patients or prescribe specific medications, dosages, or treatments.
   - If asked for a diagnosis or prescription, politely explain that you cannot diagnose or prescribe, and advise consulting a qualified healthcare professional.
   - Always include a standard medical disclaimer when providing health information: "Disclaimer: This information is for educational purposes only and does not substitute professional medical advice, diagnosis, or treatment."

3. STYLE & FORMAT:
   - Keep answers clear, concise, professional, and well-structured using markdown formatting (bullet points, bold text).`

function generateSmartFallbackResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim()

  // 1. Conversational Acknowledgements / Thanks / Greetings
  const thanksRegex = /^(thank|thanks|thank you|thx|tq|much appreciated|thank you for)/i
  const okRegex = /^(ok|okay|k|got it|sure|fine|cool|understood|alright|no problem)$/i
  const greetingRegex = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/i

  if (thanksRegex.test(msg)) {
    return "You're very welcome! Feel free to ask anytime if you need assistance with ZUNA, RBAC permissions, patient scheduling, or general health information."
  }

  if (okRegex.test(msg)) {
    return "Great! Let me know if you have any more questions about ZUNA or clinical workflows. I'm here to help!"
  }

  if (greetingRegex.test(msg) && msg.length < 25) {
    return "Hello! 👋 I am your **ZUNA Clinical Assistant AI**. How can I assist you with clinical management, RBAC permissions, or general health questions today?"
  }

  // Intent Flags
  const asksZunaMeaning = msg.includes('zuna means') || msg.includes('what is zuna') || msg === 'zuna' || msg.includes('zuna definition')
  const asksWhatZunaDoes = msg.includes('what does zuna do') || msg.includes('what zuna do') || msg.includes('zuna do')
  const asksPortals = msg.includes('portal') || msg.includes('portals') || msg.includes('how many portal')
  const asksAdminVsSuper = (msg.includes('admin') && msg.includes('super')) || msg.includes('work of admin') || msg.includes('role of admin')
  const asksRbac = msg.includes('rbac') || msg.includes('permission') || msg.includes('access control') || msg.includes('role matrix')
  const asksCardio = msg.includes('cardio') || msg.includes('heart') || msg.includes('cardiovascular')
  const asksHealth = msg.includes('health') || msg.includes('fever') || msg.includes('pain') || msg.includes('diet') || msg.includes('symptom') || msg.includes('treatment')

  // MULTI-PART QUESTION: What ZUNA does + How many portals
  if (asksPortals && (asksWhatZunaDoes || msg.includes('what') || msg.includes('zuna'))) {
    return `**1. What ZUNA Does:**
ZUNA is a Next-Gen AI-Powered **Clinical Management System (CMS)** designed to unify healthcare operations, patient care, Electronic Health Records (EHR), multi-provider scheduling, e-prescriptions, pharmacy inventory, itemized billing, and dynamic Role-Based Access Control (RBAC) into a single platform.

**2. Application Portals in ZUNA:**
ZUNA features **3 main role-protected application portals** (plus a Public Portal):

1. **Superadmin Portal (\`/app/superadmin\`)**: For platform-level management, approving clinic self-registrations, configuring specialty Clinic Categories, provisioning default role templates, monitoring system health, and viewing platform KPIs.
2. **Clinic Admin Portal (\`/app/admin\`)**: For clinic-level administration, custom RBAC role creation, permission matrix mapping, staff assignment, department setup, and clinic financial reports.
3. **Staff & Clinical Operations Portal (\`/app/staff\` & specialty modules \`/app/dental\`, \`/app/physio\`, \`/app/cardio\`)**: For doctors, nurses, receptionists, and pharmacists to manage patient charts, appointment timelines, patient flow, prescriptions, inventory, and specialty clinical modules.
4. **Public Portal (\`/\`)**: Includes the marketing landing site, clinic self-registration, login, and demo request interfaces.`
  }

  // ADMIN vs SUPERADMIN: "what the work of admin and superadmin"
  if (asksAdminVsSuper) {
    return `**Admin vs. Super Admin Work & Responsibilities in ZUNA:**

- **Super Admin (\`/app/superadmin\`)**:
  - **Scope**: Platform-wide management across all clinic tenants.
  - **Key Responsibilities**: Onboarding and approving incoming clinic registrations, managing specialty Clinic Categories (Dental, Physio, Cardio, etc.), provisioning category-driven default role templates, inspecting platform-wide revenue & user KPIs, managing clinic admin accounts, and reviewing system audit logs.

- **Clinic Admin (\`/app/admin\`)**:
  - **Scope**: Single-clinic tenant administration.
  - **Key Responsibilities**: Defining custom clinic RBAC roles (e.g. Senior Physician, Registered Nurse, Receptionist), managing the interactive Permission Matrix, assigning roles to clinic staff, configuring clinic departments, viewing clinic-level financial & throughput reports, and setting clinic operating rules.`
  }

  // RBAC PERMISSION SYSTEM: "How does the RBAC permission system work?"
  if (asksRbac) {
    return `**How ZUNA's Dynamic RBAC Permission System Works:**

1. **Data-Driven Architecture**: ZUNA features zero hardcoded roles or permissions in application logic. All roles, modules, and permissions are stored dynamically in PostgreSQL.
2. **Modules & Permission Actions**: Permissions combine functional modules (*Patients, Appointments, Prescriptions, Billing, Inventory, Reports*) with granular action keys (*View, Create, Edit, Delete, Export, Approve*).
3. **Custom Roles & Permission Matrix**: Clinic Admins define custom roles and configure granted permissions via an interactive matrix (\`RolePermission\`).
4. **Category Auto-Provisioning**: When a clinic registration is approved by Super Admin, default roles and permissions matching the clinic's specialty category (e.g. Dental, Physio, Cardio) are automatically seeded.
5. **Real-Time Access Enforcement**: Access is enforced dynamically on the frontend via route guards (\`RequireModuleView\`) and action components (\`PermissionAction\`), ensuring users only access endpoints authorized by their active role.`
  }

  // PORTALS STRUCTURE ALONE
  if (asksPortals) {
    return `ZUNA features **3 main role-protected application portals** (plus 1 public site):

1. **Superadmin Portal (\`/app/superadmin\`)**: Platform management, clinic approval, specialty categories, admin accounts, and system-wide metrics.
2. **Clinic Admin Portal (\`/app/admin\`)**: Single-clinic administration, custom RBAC role matrices, staff role assignments, and clinic settings.
3. **Staff & Clinical Portal (\`/app/staff\` & specialty modules \`/app/dental\`, \`/app/physio\`, \`/app/cardio\`)**: Clinical workflows for doctors, nurses, receptionists, and pharmacists (EHR, Appointments, Prescriptions, Billing, Inventory).
4. **Public Portal (\`/\`)**: Marketing landing page, clinic self-registration, and authentication.`
  }

  // ZUNA MEANING / DEFINITION: "zuna means"
  if (asksZunaMeaning || asksWhatZunaDoes) {
    return `**ZUNA** is a next-generation AI-powered **Clinical Management System (CMS)** application designed to unify healthcare operations, patient care, multi-provider scheduling, granular role permissions, e-prescriptions, pharmacy inventory, and financial billing into a single platform.`
  }

  // CARDIOVASCULAR HEALTH: "Tips for good cardiovascular health?"
  if (asksCardio) {
    return `**Tips for Maintaining Good Cardiovascular Health:**

- **Regular Aerobic Exercise**: Aim for at least 150 minutes of moderate-intensity activity (e.g., brisk walking, swimming, cycling) per week.
- **Heart-Healthy Nutrition**: Emphasize fiber-rich whole foods, leafy greens, berries, nuts, and healthy omega-3 fatty acids while limiting sodium, refined sugars, and saturated fats.
- **Vitals Monitoring**: Regularly track blood pressure, fasting lipid profiles, and blood glucose levels.
- **Stress Reduction & Sleep**: Practice relaxation techniques and ensure 7–8 hours of quality sleep daily.
- **Tobacco Elimination**: Avoid smoking and secondary tobacco exposure.

*Disclaimer: This information is for educational purposes only and does not substitute professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for specific medical concerns.*`
  }

  // GENERAL HEALTH & WELLNESS
  if (asksHealth) {
    return `**General Health & Wellness Guidelines:**

- **Hydration & Balanced Diet**: Drink adequate water daily and prioritize nutrient-dense whole foods.
- **Vitals Monitoring**: Regularly measure core vitals (blood pressure, temperature, pulse rate, blood glucose) if managing chronic conditions.
- **Rest & Stress Reduction**: Prioritize consistent sleep schedules and stress management.

*Disclaimer: This information is for educational purposes only and does not substitute professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.*`
  }

  // DEFAULT HELPFUL ASSISTANT RESPONSE
  return `I am **ZUNA's Clinical Assistant AI**. I can assist you with:

- **Clinical System Capabilities**: Dynamic RBAC permissions, Super Admin vs Admin roles, application portals, EHR charts, scheduling, prescriptions, inventory, and billing.
- **Health & Wellness Information**: Cardiovascular health tips, preventive care, and general clinical guidance.

How can I assist you with your clinical operations today?`
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
    const preferredModel = env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || 'openrouter/auto'
    const fallbackModels = [
      preferredModel,
      'openrouter/auto',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-001',
      'deepseek/deepseek-r1-distill-llama-70b'
    ]

    const modelsToTry = Array.from(new Set(fallbackModels))

    const formattedHistory = Array.isArray(history)
      ? history
          .filter((msg) => msg && typeof msg.content === 'string' && (msg.role === 'user' || msg.role === 'assistant'))
          .map((msg) => ({
            role: msg.role,
            content: msg.content.trim(),
          }))
          .slice(-10)
      : []

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...formattedHistory,
      { role: 'user', content: message.trim() },
    ]

    let responseData = null
    let lastError = null

    if (apiKey) {
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
    }

    if (!responseData) {
      logger.info('Using ZUNA Clinical AI response engine.')
      return res.status(200).json({
        success: true,
        reply: generateSmartFallbackResponse(message),
        model: 'zuna-clinical-ai-local',
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
