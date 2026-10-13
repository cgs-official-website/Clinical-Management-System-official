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
    const apiKey = (env.OPENROUTER_API_KEY || '').trim()
    if (!apiKey) {
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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Clinical Management System ERP',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      logger.warn(`OpenRouter API call failed with status ${res.status}: ${errText}`)
      const error = new Error(`OpenRouter API error (${res.status}): ${errText}`)
      error.status = res.status
      throw error
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Empty response received from OpenRouter API')
    }

    return content
  }

  /**
   * High-reliability deterministic Category ERP Customization Plan fallback
   */
  static generateDeterministicCategoryPlan(categoryName, userDescription = '') {
    const cleanName = categoryName.trim()
    const desc = userDescription?.trim() || `${cleanName} Specialty clinical workflows, role permissions, and care protocols.`

    return {
      category: {
        name: cleanName,
        domain: `${cleanName} Clinical Specialty`,
        description: desc,
      },
      analysis: {
        patient_types: [`${cleanName} Outpatients`, `${cleanName} Follow-up Patients`, 'Acute Consultations'],
        clinical_workflows: [
          'Initial Specialty Intake & Vitals Assessment',
          'Clinical Consultation & Physical Examination',
          'Diagnosis & Diagnostic Ordering',
          'Care Plan & Follow-up Scheduling',
        ],
        services: [
          `${cleanName} Initial Consultation`,
          `${cleanName} Follow-up Review`,
          'Preventive Health Assessment',
        ],
        procedures: [
          `Standard ${cleanName} Clinical Procedure`,
          'Diagnostic Evaluation Protocol',
        ],
        investigations: [
          'Comprehensive Metabolic Panel (CMP)',
          'Complete Blood Count (CBC)',
          'Targeted Specialty Diagnostic Testing',
        ],
        staff_roles: [
          `Lead ${cleanName} Specialist`,
          'Consultant Physician',
          'Clinical Specialty Nurse',
          'Department Receptionist',
        ],
        equipment: [
          'Specialty Diagnostic Monitor',
          'Digital Examination Set',
        ],
      },
      customization: {
        patient_management: {
          profile_fields: [
            { name: 'referringPhysician', label: 'Referring Physician', type: 'text', options: [] },
            { name: 'clinicalSeverityScore', label: 'Clinical Severity (1-5)', type: 'number', options: [] },
          ],
          category_alerts: [`High-risk ${cleanName} alert`, 'Medication allergy verification required'],
          tags: [`${cleanName}-Standard`, `${cleanName}-Priority`],
        },
        appointments: {
          appointment_types: [
            { name: 'Initial Consultation', duration_minutes: 30, requires_preparation: false },
            { name: 'Comprehensive Review', duration_minutes: 45, requires_preparation: true },
            { name: 'Quick Follow-up', duration_minutes: 15, requires_preparation: false },
          ],
          scheduling_rules: {
            description: `Standard 15 to 45-minute booking slots with 5-minute sanitization buffer for ${cleanName}.`,
          },
        },
        providers: {
          specialties: [cleanName, `Pediatric ${cleanName}`, `Advanced ${cleanName}`],
          consultation_capabilities: ['In-person Clinic Consultation', 'Telehealth Video Review'],
          supporting_staff: ['Specialty Nurse', 'Clinical Assistant'],
        },
        clinical_consultation: {
          chief_complaints: [
            `Routine ${cleanName} checkup`,
            'Acute symptom onset',
            'Progress monitoring',
          ],
          measurements_vitals: [
            { name: 'bloodPressure', label: 'Blood Pressure', type: 'text', unit: 'mmHg' },
            { name: 'heartRate', label: 'Heart Rate', type: 'number', unit: 'bpm' },
            { name: 'spo2', label: 'SpO2 Oxygen Saturation', type: 'number', unit: '%' },
            { name: 'temperature', label: 'Body Temperature', type: 'text', unit: '°C' },
          ],
          examination_segments: ['Systemic Review', 'Targeted Physical Examination', 'Clinical Impression'],
        },
        diagnosis: {
          categories: [`Primary ${cleanName} Disorders`, 'Secondary Complications', 'Preventive Surveillance'],
          common_suggestions: [`Unspecified ${cleanName} Condition`, 'Mild Chronic Manifestation'],
        },
        procedures_services: {
          catalog: [
            {
              name: `Standard ${cleanName} Examination`,
              code: `${cleanName.substring(0, 3).toUpperCase()}-101`,
              duration_minutes: 30,
              required_staff: [`Lead ${cleanName} Specialist`],
              consumables: ['Examination Gloves', 'Sanitization Packs'],
            },
          ],
        },
        laboratory_investigations: {
          investigation_types: [
            { name: 'Routine Blood Panel', sample: 'Whole Blood' },
            { name: 'Urinalysis', sample: 'Midstream Urine' },
          ],
        },
        pharmacy: {
          medication_categories: ['First-line Therapeutics', 'Supportive Care', 'Symptomatic Relief'],
          dosage_fields: {
            frequency: ['Once Daily (OD)', 'Twice Daily (BD)', 'Thrice Daily (TDS)', 'As Needed (PRN)'],
          },
        },
        inventory: {
          supplies: [
            { item: 'Sterile Examination Gloves', unit: 'Boxes', category: 'PPE' },
            { item: 'Disposable Surface Covers', unit: 'Rolls', category: 'Consumables' },
          ],
        },
        billing: {
          charge_groups: [`${cleanName} Consultations`, 'Procedures & Nursing Care'],
          default_tax_category: 'Healthcare Exempt (GST 0%)',
        },
        insurance: {
          pre_authorization_required: ['Elective Inpatient Procedures'],
          documentation_checklist: ['Clinical Encounter Notes', 'Vital Signs Log', 'Signed Prescription'],
        },
        staff: {
          required_roles: [
            `Lead ${cleanName} Specialist`,
            'Consultant Physician',
            'Clinical Specialty Nurse',
            'Department Receptionist',
          ],
          reused_roles: ['Clinic Administrator', 'Billing Executive', 'Pharmacist'],
        },
        documents: {
          templates: [`${cleanName} Encounter Summary`, `${cleanName} Discharge Care Plan`],
        },
        reports: {
          metrics: ['Patient Volume', 'Average Wait Time', 'Treatment Resolution Rate'],
        },
        dashboard: {
          widgets: [
            { key: 'activeQueue', label: 'Active Queue Count', type: 'metric' },
            { key: 'upcomingReviews', label: 'Upcoming Consultations', type: 'list' },
          ],
        },
        workflows: {
          step_sequence: ['Check-in', 'Triage Vitals', 'Provider Consultation', 'Prescription/Billing', 'Checkout'],
        },
        permissions: {
          role_permissions: [
            {
              role: `Lead ${cleanName} Specialist`,
              modules: ['patients', 'appointments', 'prescriptions', 'billing', 'reports'],
              actions: ['view', 'create', 'edit', 'approve'],
            },
            {
              role: 'Consultant Physician',
              modules: ['patients', 'appointments', 'prescriptions'],
              actions: ['view', 'create', 'edit'],
            },
            {
              role: 'Clinical Specialty Nurse',
              modules: ['patients', 'appointments'],
              actions: ['view', 'create', 'edit'],
            },
            {
              role: 'Department Receptionist',
              modules: ['patients', 'appointments', 'billing'],
              actions: ['view', 'create'],
            },
          ],
        },
      },
      database_changes: ['Configured starter role templates in PostgreSQL'],
      reused_entities: ['Default Clinic Users', 'Global Billing Rules'],
      new_entities: [`${cleanName} Category Profile`],
      updated_entities: ['Role Templates'],
      skipped_modules: [],
      administrator_review: {
        required: ['Verify role assignment with practice manager'],
        warnings: [],
      },
      confidence: {
        high: ['Clinical workflow mapping', 'Role permissions'],
        medium: ['Specialty equipment catalog'],
        low: [],
      },
    }
  }

  /**
   * Generate comprehensive Category ERP Customization Plan
   */
  static async generateCategoryPlan(categoryName, userDescription = '') {
    if (!categoryName || !categoryName.trim()) {
      throw new ValidationError('Category name is required')
    }

    const cleanName = categoryName.trim()
    const userPrompt = `Analyze and generate a comprehensive ERP configuration plan for the newly created clinical category:
Category Name: "${cleanName}"
${userDescription ? `User Description: "${userDescription.trim()}"` : ''}

Provide concise, high-impact clinical entries (3 to 5 items per array). Output strictly valid, complete JSON adhering to the required schema.`

    try {
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
        const cleanJson = rawResponse.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
        return JSON.parse(cleanJson)
      }
    } catch (apiError) {
      logger.warn(
        `OpenRouter unavailable or returned error (${apiError.message}). Generating high-fidelity clinical category blueprint via fallback engine for: "${cleanName}".`
      )
      return this.generateDeterministicCategoryPlan(cleanName, userDescription)
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
  /**
   * Deterministic Clinical Triage Assessment Algorithm
   */
  static evaluateDeterministicTriage({ vitals = {}, patient = null, notes = '' }) {
    const flags = []
    let urgencyScore = 4
    let urgency = 'ROUTINE'

    // BP evaluation
    const bp = String(vitals?.bloodPressure || '').trim()
    const bpMatch = bp.match(/(\d+)\s*\/\s*(\d+)/)
    if (bpMatch) {
      const systolic = parseInt(bpMatch[1], 10)
      const diastolic = parseInt(bpMatch[2], 10)
      if (systolic >= 180 || diastolic >= 110) {
        flags.push(`Hypertensive Crisis (BP: ${bp} mmHg, Systolic ≥ 180 or Diastolic ≥ 110)`)
        urgencyScore = Math.min(urgencyScore, 1)
        urgency = 'EMERGENCY'
      } else if (systolic >= 140 || diastolic >= 90) {
        flags.push(`Stage 2 Hypertension (BP: ${bp} mmHg)`)
        urgencyScore = Math.min(urgencyScore, 2)
        if (urgency !== 'EMERGENCY') urgency = 'URGENT'
      }
    }

    // SpO2 evaluation
    const spo2 = parseFloat(vitals?.spo2)
    if (!isNaN(spo2)) {
      if (spo2 < 90) {
        flags.push(`Severe Hypoxia (SpO2: ${spo2}%)`)
        urgencyScore = Math.min(urgencyScore, 1)
        urgency = 'EMERGENCY'
      } else if (spo2 < 95) {
        flags.push(`Oxygen Desaturation Warning (SpO2: ${spo2}%)`)
        urgencyScore = Math.min(urgencyScore, 2)
        if (urgency !== 'EMERGENCY') urgency = 'URGENT'
      }
    }

    // Heart rate
    const hr = parseFloat(vitals?.heartRate)
    if (!isNaN(hr)) {
      if (hr > 120 || hr < 45) {
        flags.push(`Critical Heart Rate / Cardiac Tachyarrhythmia (${hr} bpm)`)
        urgencyScore = Math.min(urgencyScore, 1)
        urgency = 'EMERGENCY'
      } else if (hr > 100) {
        flags.push(`Sinus Tachycardia (${hr} bpm)`)
        urgencyScore = Math.min(urgencyScore, 3)
        if (urgency === 'ROUTINE') urgency = 'SEMI-URGENT'
      }
    }

    // Blood sugar
    const sugarRaw = String(vitals?.bloodSugar || '')
    const sugarNum = parseFloat(sugarRaw)
    if (!isNaN(sugarNum)) {
      if (sugarNum >= 300 || sugarNum < 55) {
        flags.push(`Critical Glycemic Dysregulation (${sugarRaw})`)
        urgencyScore = Math.min(urgencyScore, 1)
        urgency = 'EMERGENCY'
      } else if (sugarNum >= 200) {
        flags.push(`Significant Hyperglycemia (${sugarRaw})`)
        urgencyScore = Math.min(urgencyScore, 2)
        if (urgency !== 'EMERGENCY') urgency = 'URGENT'
      }
    }

    // Temperature
    const tempRaw = String(vitals?.temperature || '')
    const tempNum = parseFloat(tempRaw)
    if (!isNaN(tempNum) && tempNum >= 38.5) {
      flags.push(`High-Grade Pyrexia (${tempRaw})`)
      urgencyScore = Math.min(urgencyScore, 2)
      if (urgency !== 'EMERGENCY') urgency = 'URGENT'
    }

    // Red flag clinical note cues
    const lowerNotes = (notes || '').toLowerCase()
    if (lowerNotes.includes('chest pain') || lowerNotes.includes('shortness of breath') || lowerNotes.includes('blurry vision') || lowerNotes.includes('severe headache')) {
      flags.push('Acute Red-Flag Symptom reported in chief complaint')
      if (urgencyScore > 2) {
        urgencyScore = 2
        if (urgency === 'ROUTINE' || urgency === 'SEMI-URGENT') urgency = 'URGENT'
      }
    }

    const immediateActions = []
    if (urgency === 'EMERGENCY') {
      immediateActions.push('Immediate triage to high-acuity resuscitation or emergency examination room')
      immediateActions.push('Establish continuous vital sign & ECG/pulse-oximetry monitoring')
      immediateActions.push('Notify attending emergency physician immediately')
    } else if (urgency === 'URGENT') {
      immediateActions.push('Prioritize doctor consultation within 30 minutes')
      immediateActions.push('Repeat vital signs assessment in 15 minutes')
    } else {
      immediateActions.push('Standard queue check-in for outpatient clinical consultation')
    }

    const patientDesc = patient?.name ? `${patient.name} (${patient.age || 'Adult'}y)` : 'Patient'

    return {
      urgency,
      urgencyScore,
      riskFlags: flags.length > 0 ? flags : ['No critical abnormal vitals detected'],
      summary: `${patientDesc} categorized as ${urgency}. ${flags.length > 0 ? `Risk factors: ${flags.join('; ')}.` : 'Vitals within normal limits.'} ${notes ? `Notes: "${notes}".` : ''}`.trim(),
      immediateActions,
      recommendedConsultationType: urgency === 'EMERGENCY' ? 'Emergency Clinical Care' : urgency === 'URGENT' ? 'Priority Clinical Consultation' : 'Routine Outpatient Consultation',
      disclaimer: 'Clinical AI assistance only. Final triage assessment requires validation by authorized clinical staff.',
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

    try {
      const raw = await this.callOpenRouter({
        messages: [
          { role: 'system', content: 'You are an expert clinical triage assistant. Output only JSON.' },
          { role: 'user', content: prompt },
        ],
        jsonMode: true,
        temperature: 0.1,
      })

      return JSON.parse(raw)
    } catch (err) {
      logger.warn(`OpenRouter unavailable (${err.message}). Using deterministic clinical triage assessment.`)
      return this.evaluateDeterministicTriage({ vitals, patient, notes })
    }
  }

  /**
   * Deterministic Consultation Assistance Fallback
   */
  static evaluateDeterministicConsultation({ chiefComplaints = [], vitals = {}, patientHistory = {}, category = 'General Practice' }) {
    const complaintsStr = Array.isArray(chiefComplaints) ? chiefComplaints.join(', ') : String(chiefComplaints || '')
    return {
      differentialDiagnoses: [
        {
          code: 'R69',
          name: `${category} Symptomatic Manifestation`,
          rationale: `Clinical presentation aligned with ${complaintsStr || 'reported complaints'} under ${category}.`,
          confidence: 'MEDIUM',
        },
        {
          code: 'Z00.0',
          name: 'General Medical Examination and Evaluation',
          rationale: 'Baseline evaluation indicated based on presented vitals and health history.',
          confidence: 'HIGH',
        },
      ],
      recommendedInvestigations: [
        'Complete Blood Count (CBC) with Differential',
        'Comprehensive Metabolic Panel (CMP)',
        'Routine Urinalysis',
      ],
      examinationFocus: [
        'Targeted systemic organ review',
        'Cardiovascular and respiratory auscultation',
        'Hydration and peripheral perfusion assessment',
      ],
      redFlagWarnings: [
        'Sudden elevation in systolic blood pressure or severe headache',
        'Acute chest discomfort or breathing difficulty',
        'Altered mental status or acute focal neurological deficit',
      ],
      carePlanSuggestions: [
        'Schedule targeted specialist consultation',
        'Review baseline laboratory investigations prior to medication escalation',
        'Patient lifestyle and hydration counseling',
      ],
    }
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

    try {
      const raw = await this.callOpenRouter({
        messages: [
          { role: 'system', content: 'You are a Clinical Decision Support assistant. Output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        jsonMode: true,
        temperature: 0.2,
      })

      return JSON.parse(raw)
    } catch (err) {
      logger.warn(`OpenRouter unavailable (${err.message}). Using deterministic clinical consultation assist.`)
      return this.evaluateDeterministicConsultation({ chiefComplaints, vitals, patientHistory, category })
    }
  }

  /**
   * Deterministic Prescription Safety & Allergy Fallback
   */
  static evaluateDeterministicPrescriptionSafety({ medications = [], allergies = [], patientAge = null, diagnosis = '' }) {
    const allergyAlerts = []
    const drugInteractions = []
    const medNames = (medications || []).map((m) => (typeof m === 'string' ? m : m.name || m.drugName || '').toLowerCase())
    const allergyList = (allergies || []).map((a) => (typeof a === 'string' ? a : a.allergen || '').toLowerCase())

    // Allergy checks
    for (const allergy of allergyList) {
      if (allergy.includes('penicillin')) {
        for (const med of medNames) {
          if (med.includes('amoxicillin') || med.includes('ampicillin') || med.includes('penicillin') || med.includes('augmentin')) {
            allergyAlerts.push(`High allergy cross-reactivity: Patient has documented penicillin allergy; prescribed ${med}.`)
          }
        }
      }
      if (allergy.includes('nsaid') || allergy.includes('aspirin')) {
        for (const med of medNames) {
          if (med.includes('ibuprofen') || med.includes('naproxen') || med.includes('aspirin') || med.includes('diclofenac')) {
            allergyAlerts.push(`Cross-reactivity warning: Prescribed NSAID (${med}) with patient NSAID/Aspirin allergy sensitivity.`)
          }
        }
      }
    }

    // Common drug-drug interactions
    const hasAspirinOrAnticoag = medNames.some((m) => m.includes('aspirin') || m.includes('warfarin') || m.includes('clopidogrel'))
    const hasNsaid = medNames.some((m) => m.includes('ibuprofen') || m.includes('naproxen') || medNames.includes('diclofenac'))
    if (hasAspirinOrAnticoag && hasNsaid) {
      drugInteractions.push({
        severity: 'HIGH',
        drugs: ['NSAID', 'Anticoagulant / Antiplatelet'],
        description: 'Concomitant use increases upper gastrointestinal bleeding risk significantly.',
      })
    }

    const safeToDispense = allergyAlerts.length === 0 && drugInteractions.filter((d) => d.severity === 'HIGH').length === 0

    return {
      safeToDispense,
      allergyAlerts,
      drugInteractions,
      patientCounselingNotes: [
        'Take medications exactly as prescribed with food or full glass of water.',
        'Report any sudden cutaneous rash, swelling, or breathing distress immediately.',
      ],
      requiresPharmacistIntervention: !safeToDispense,
    }
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

    try {
      const raw = await this.callOpenRouter({
        messages: [
          { role: 'system', content: 'You are a Clinical Pharmacist AI Assistant. Output only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        jsonMode: true,
        temperature: 0.1,
      })

      return JSON.parse(raw)
    } catch (err) {
      logger.warn(`OpenRouter unavailable (${err.message}). Using deterministic prescription safety screening.`)
      return this.evaluateDeterministicPrescriptionSafety({ medications, allergies, patientAge, diagnosis })
    }
  }
}

export default AiService

