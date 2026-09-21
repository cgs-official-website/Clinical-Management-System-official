import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { logger } from '../utils/logger.js'
import { ValidationError, NotFoundError } from '../utils/errors.js'
import { AuditService } from './audit.service.js'

const SYSTEM_PROMPT_CATEGORY_ENGINE = `# Clinical ERP — Automatic Category-Based Customization Engine
You are the AI configuration engine for a Clinical Management System ERP.
Whenever a user creates a new clinical category, your responsibility is to automatically analyze that category and customize the entire ERP system to support it.
The customization must be comprehensive, consistent, clinically appropriate, and production-ready.

Core Objective:
Treat the category as a new clinical/business domain within the ERP. The category must become a first-class entity throughout the entire ERP (Patient Management, Appointment Types, Doctor/Provider specialties, Clinical Consultations, Diagnosis templates, Procedures/Services, Lab/Imaging, Pharmacy, Inventory consumables, Billing, Staff roles, Documents, Reports, Dashboard, Workflows, Permissions).

Safety Rules:
- Do not autonomously prescribe medication or finalize diagnoses.
- When information is uncertain, mark as "Requires clinical administrator review."
- Return confidence scores ('HIGH', 'MEDIUM', 'LOW').

You MUST respond strictly with a valid JSON object following this exact schema:
{
  "category": {
    "name": "string",
    "domain": "string",
    "description": "string"
  },
  "analysis": {
    "patient_types": ["string"],
    "clinical_workflows": ["string"],
    "services": ["string"],
    "procedures": ["string"],
    "investigations": ["string"],
    "staff_roles": ["string"],
    "equipment": ["string"]
  },
  "customization": {
    "patient_management": {
      "profile_fields": [{ "name": "string", "label": "string", "type": "string", "options": ["string"] }],
      "category_alerts": ["string"],
      "tags": ["string"]
    },
    "appointments": {
      "appointment_types": [{ "name": "string", "duration_minutes": 30, "requires_preparation": false }],
      "scheduling_rules": { "description": "string" }
    },
    "providers": {
      "specialties": ["string"],
      "consultation_capabilities": ["string"],
      "supporting_staff": ["string"]
    },
    "clinical_consultation": {
      "chief_complaints": ["string"],
      "measurements_vitals": [{ "name": "string", "label": "string", "type": "string", "unit": "string" }],
      "examination_segments": ["string"]
    },
    "diagnosis": {
      "categories": ["string"],
      "common_suggestions": ["string"]
    },
    "procedures_services": {
      "catalog": [{ "name": "string", "code": "string", "duration_minutes": 30, "required_staff": ["string"], "consumables": ["string"] }]
    },
    "laboratory_investigations": {
      "investigation_types": [{ "name": "string", "sample": "string" }]
    },
    "pharmacy": {
      "medication_categories": ["string"],
      "dosage_fields": { "frequency": ["string"] }
    },
    "inventory": {
      "supplies": [{ "item": "string", "unit": "string", "category": "string" }]
    },
    "billing": {
      "charge_groups": ["string"],
      "default_tax_category": "string"
    },
    "insurance": {
      "pre_authorization_required": ["string"],
      "documentation_checklist": ["string"]
    },
    "staff": {
      "required_roles": ["string"],
      "reused_roles": ["string"]
    },
    "documents": {
      "templates": ["string"]
    },
    "reports": {
      "metrics": ["string"]
    },
    "dashboard": {
      "widgets": [{ "key": "string", "label": "string", "type": "string" }]
    },
    "workflows": {
      "step_sequence": ["string"]
    },
    "permissions": {
      "role_permissions": [
        {
          "role": "string",
          "modules": ["patients", "appointments", "prescriptions", "billing", "inventory", "clinical_config", "reports"],
          "actions": ["view", "create", "edit", "approve"]
        }
      ]
    }
  },
  "database_changes": ["string"],
  "reused_entities": ["string"],
  "new_entities": ["string"],
  "updated_entities": ["string"],
  "skipped_modules": ["string"],
  "administrator_review": {
    "required": ["string"],
    "warnings": ["string"]
  },
  "confidence": {
    "high": ["string"],
    "medium": ["string"],
    "low": ["string"]
  }
}
`

export class AiService {
  /**
   * Helper to dispatch calls to OpenRouter API
   */
  static async callOpenRouter({ messages, model = env.OPENROUTER_MODEL, jsonMode = true, temperature = 0.2, maxTokens = 3500 }) {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured in server environment')
    }

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }

    if (jsonMode) {
      payload.response_format = { type: 'json_object' }
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Clinical Management System ERP',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      logger.error(`OpenRouter API call failed with status ${res.status}: ${errText}`)
      throw new Error(`OpenRouter API error (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Empty response received from OpenRouter API')
    }

    return content
  }

  /**
   * Generate comprehensive Category ERP Customization Plan
   */
  static async generateCategoryPlan(categoryName, userDescription = '') {
    if (!categoryName || !categoryName.trim()) {
      throw new ValidationError('Category name is required')
    }

    const userPrompt = `Analyze and generate a comprehensive ERP configuration plan for the newly created clinical category:
Category Name: "${categoryName.trim()}"
${userDescription ? `User Description: "${userDescription.trim()}"` : ''}

Provide concise, high-impact clinical entries (3 to 5 items per array). Output strictly valid, complete JSON adhering to the required schema.`

    const rawResponse = await this.callOpenRouter({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_CATEGORY_ENGINE },
        { role: 'user', content: userPrompt },
      ],
      jsonMode: true,
      temperature: 0.1,
      maxTokens: 6000,
    })

    try {
      return JSON.parse(rawResponse)
    } catch (parseError) {
      logger.error(`Failed to parse OpenRouter JSON output: ${rawResponse}`)
      // Attempt clean extraction if wrapped in code blocks
      const cleanJson = rawResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      return JSON.parse(cleanJson)
    }
  }

  /**
   * Auto-provision a category and its blueprints into PostgreSQL using OpenRouter
   */
  static async autoprovisionCategory(categoryName, userDescription = '', actorId = null) {
    if (!categoryName || !categoryName.trim()) {
      throw new ValidationError('Category name is required')
    }
    const cleanName = categoryName.trim()

    // 1. Generate full plan via OpenRouter
    logger.info(`Invoking OpenRouter AI engine for clinical category: "${cleanName}"`)
    const plan = await this.generateCategoryPlan(cleanName, userDescription)

    const finalDescription = userDescription?.trim() || plan.category?.description || `${cleanName} Clinical Specialty`

    // 2. Upsert Category in DB
    let category = await prisma.clinicCategory.findUnique({
      where: { name: cleanName },
    })

    if (!category) {
      category = await prisma.clinicCategory.create({
        data: {
          name: cleanName,
          description: finalDescription,
          isActive: true,
        },
      })
    } else if (!category.description) {
      category = await prisma.clinicCategory.update({
        where: { id: category.id },
        data: { description: finalDescription },
      })
    }

    // 3. Extract and Provision Starter Role Templates
    const rolePermissions = plan.customization?.permissions?.role_permissions || []
    const requiredRoles = plan.customization?.staff?.required_roles || plan.analysis?.staff_roles || []
    
    // Build array of template objects to insert
    const templatesToInsert = []

    if (Array.isArray(rolePermissions) && rolePermissions.length > 0) {
      for (const rp of rolePermissions) {
        const roleName = rp.role?.trim()
        if (!roleName) continue
        const modules = Array.isArray(rp.modules) ? rp.modules : ['patients', 'appointments']
        const actions = Array.isArray(rp.actions) ? rp.actions : ['view', 'create']

        for (const mod of modules) {
          for (const act of actions) {
            templatesToInsert.push({
              clinicCategoryId: category.id,
              roleName,
              module: mod,
              action: act,
            })
          }
        }
      }
    } else {
      // Fallback default permissions for each suggested role
      for (const r of requiredRoles) {
        const roleName = typeof r === 'string' ? r.trim() : r.name?.trim()
        if (!roleName) continue
        const defaultModules = ['patients', 'appointments', 'prescriptions', 'clinical_config']
        for (const mod of defaultModules) {
          templatesToInsert.push({
            clinicCategoryId: category.id,
            roleName,
            module: mod,
            action: 'view',
          })
          templatesToInsert.push({
            clinicCategoryId: category.id,
            roleName,
            module: mod,
            action: 'create',
          })
        }
      }
    }

    // Provision into DB using fast batch operations
    await prisma.clinicCategoryRoleTemplate.deleteMany({
      where: { clinicCategoryId: category.id },
    })

    if (templatesToInsert.length > 0) {
      await prisma.clinicCategoryRoleTemplate.createMany({
        data: templatesToInsert,
        skipDuplicates: true,
      })
    }

    // Link standard modules to category in ClinicCategoryModule
    const allModules = await prisma.module.findMany({ select: { id: true } })
    if (allModules.length > 0) {
      await prisma.clinicCategoryModule.createMany({
        data: allModules.map((m, idx) => ({
          clinicCategoryId: category.id,
          moduleId: m.id,
          displayOrder: idx + 1,
        })),
        skipDuplicates: true,
      })
    }

    await AuditService.log({
      actorId,
      action: 'CLINIC_CATEGORY_AI_PROVISIONED',
      entityType: 'ClinicCategory',
      entityId: category.id,
      details: {
        categoryName: category.name,
        templatesCount: templatesToInsert.length,
        model: env.OPENROUTER_MODEL,
      },
    })

    return {
      success: true,
      message: `Category "${category.name}" and full ERP blueprint auto-provisioned with AI`,
      category,
      provisionedTemplatesCount: templatesToInsert.length,
      plan,
    }
  }

  /**
   * AI Triage & Vitals Analyzer
   */
  static async analyzeTriage({ vitals, patient = null, notes = '' }) {
    const prompt = `You are a Clinical Triage AI Assistant.
Analyze the following patient vitals and clinical notes:
Patient Info: ${JSON.stringify(patient || {})}
Vitals: ${JSON.stringify(vitals || {})}
Clinical Notes: "${notes}"

Evaluate:
1. Urgency Level: ("EMERGENCY", "URGENT", "SEMI-URGENT", "ROUTINE")
2. Primary Risk Flags: List of detected critical abnormalities (e.g. Stage 2 Hypertension, Tachycardia, Hypoxia, Hypoglycemia).
3. Recommended Immediate Action: Nursing/Triage check-in instruction.
4. Clinician Review Notice: Mandatory disclaimer that clinical decisions must be confirmed by a licensed medical provider.

Respond strictly with a JSON object:
{
  "urgency": "EMERGENCY" | "URGENT" | "SEMI-URGENT" | "ROUTINE",
  "urgencyScore": 1-5,
  "riskFlags": ["string"],
  "summary": "string",
  "immediateActions": ["string"],
  "recommendedConsultationType": "string",
  "disclaimer": "Clinical AI assistance only. Final triage assessment requires validation by authorized clinical staff."
}`

    const raw = await this.callOpenRouter({
      messages: [
        { role: 'system', content: 'You are an expert clinical triage assistant. Output only JSON.' },
        { role: 'user', content: prompt },
      ],
      jsonMode: true,
      temperature: 0.1,
    })

    return JSON.parse(raw)
  }

  /**
   * AI Clinical Consultation Assistant (Differential diagnosis, notes, investigations)
   */
  static async consultationAssist({ chiefComplaints, vitals, patientHistory, category = 'General Practice' }) {
    const prompt = `You are a Physician Clinical Decision Support AI in a Clinical ERP for category: ${category}.
Chief Complaints: ${JSON.stringify(chiefComplaints || [])}
Vitals: ${JSON.stringify(vitals || {})}
Patient History: ${JSON.stringify(patientHistory || {})}

Provide:
1. Differential Diagnoses (ICD-10 aligned suggestion list with clinical rationale)
2. Recommended Diagnostic Investigations / Labs
3. Key Physical Examination Focus Points
4. Red Flag Symptoms to monitor

Respond strictly with JSON:
{
  "differentialDiagnoses": [
    { "code": "string", "name": "string", "rationale": "string", "confidence": "HIGH" | "MEDIUM" | "LOW" }
  ],
  "recommendedInvestigations": ["string"],
  "examinationFocus": ["string"],
  "redFlagWarnings": ["string"],
  "carePlanSuggestions": ["string"]
}`

    const raw = await this.callOpenRouter({
      messages: [
        { role: 'system', content: 'You are a Clinical Decision Support assistant. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      jsonMode: true,
      temperature: 0.2,
    })

    return JSON.parse(raw)
  }

  /**
   * AI Prescription Safety & Allergy Review
   */
  static async reviewPrescriptionSafety({ medications, allergies = [], patientAge = null, diagnosis = '' }) {
    const prompt = `You are a Clinical Pharmacovigilance & Prescription Safety AI.
Prescribed Medications: ${JSON.stringify(medications || [])}
Known Patient Allergies: ${JSON.stringify(allergies || [])}
Patient Age: ${patientAge || 'Adult'}
Diagnosis: "${diagnosis}"

Evaluate:
1. Allergy Cross-Reactivity Risk
2. Drug-Drug Interactions
3. Dosage / Frequency Warnings
4. Patient Administration Guidance

Respond strictly with JSON:
{
  "safeToDispense": boolean,
  "allergyAlerts": ["string"],
  "drugInteractions": [
    { "severity": "HIGH" | "MODERATE" | "LOW", "drugs": ["string"], "description": "string" }
  ],
  "patientCounselingNotes": ["string"],
  "requiresPharmacistIntervention": boolean
}`

    const raw = await this.callOpenRouter({
      messages: [
        { role: 'system', content: 'You are a Clinical Pharmacist AI Assistant. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      jsonMode: true,
      temperature: 0.1,
    })

    return JSON.parse(raw)
  }
}

export default AiService
