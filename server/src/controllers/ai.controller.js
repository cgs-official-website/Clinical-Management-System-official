import { AiService } from '../services/ai.service.js'
import { env } from '../config/env.js'

export class AiController {
  /**
   * Status & Health of AI Engine
   */
  static async getStatus(req, res, next) {
    try {
      return res.status(200).json({
        success: true,
        configured: Boolean(env.OPENROUTER_API_KEY),
        model: env.OPENROUTER_MODEL,
        provider: 'OpenRouter',
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Generate Full Category ERP Customization Plan (Without DB changes)
   */
  static async generateCategoryPlan(req, res, next) {
    try {
      const { name, description } = req.body
      const plan = await AiService.generateCategoryPlan(name, description)
      return res.status(200).json({
        success: true,
        category: name,
        plan,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Auto-Provision Category and Its Blueprints via AI
   */
  static async autoprovisionCategory(req, res, next) {
    try {
      const { name, description } = req.body
      const result = await AiService.autoprovisionCategory(name, description, req.user?.id)
      return res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }

  /**
   * AI Triage & Vitals Analyzer
   */
  static async analyzeTriage(req, res, next) {
    try {
      const result = await AiService.analyzeTriage(req.body)
      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * AI Clinical Consultation Assistant
   */
  static async consultationAssist(req, res, next) {
    try {
      const result = await AiService.consultationAssist(req.body)
      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * AI Prescription Safety & Allergy Review
   */
  static async reviewPrescriptionSafety(req, res, next) {
    try {
      const result = await AiService.reviewPrescriptionSafety(req.body)
      return res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default AiController
