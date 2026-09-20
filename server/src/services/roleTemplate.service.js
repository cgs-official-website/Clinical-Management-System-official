import { prisma } from '../config/prisma.js'
import { logger } from '../utils/logger.js'
import {
  ALL_SYSTEM_MODULES,
  ALL_ACTIONS,
  MODIFIER_KEYWORDS,
  DEFAULT_ROLE_TEMPLATES
} from '../constants/defaultRoleTemplates.js'

export class RoleTemplateService {
  /**
   * Fetch active templates for a tenant.
   * If the tenant has configured custom templates, return them.
   * Otherwise, fall back to global templates (tenantId is null).
   */
  static async getTemplatesForTenant(tenantId = null) {
    try {
      if (tenantId) {
        const tenantTemplates = await prisma.roleTemplate.findMany({
          where: { tenantId },
          orderBy: [{ keyword: 'asc' }, { module: 'asc' }, { action: 'asc' }]
        })

        if (tenantTemplates && tenantTemplates.length > 0) {
          return tenantTemplates.map(t => ({
            ...t,
            isTenantCustom: true
          }))
        }
      }

      // Fallback to global defaults in DB
      const globalTemplates = await prisma.roleTemplate.findMany({
        where: { tenantId: null },
        orderBy: [{ keyword: 'asc' }, { module: 'asc' }, { action: 'asc' }]
      })

      if (globalTemplates && globalTemplates.length > 0) {
        return globalTemplates.map(t => ({
          ...t,
          isTenantCustom: false
        }))
      }
    } catch (err) {
      logger.warn(`Failed to query RoleTemplate table from DB (${err.message}). Using offline fallback constants.`)
    }

    // 100% resilient offline fallback to default constants
    return DEFAULT_ROLE_TEMPLATES.map((t, idx) => ({
      id: `default-${idx}`,
      tenantId: null,
      keyword: t.keyword,
      module: t.module,
      action: t.action,
      isWildcard: t.isWildcard,
      isTenantCustom: false
    }))
  }

  /**
   * Deterministic rule-based matching engine.
   * Analyzes roleName, performs case-insensitive substring matching against templates,
   * handles wildcards and modifiers ("senior", "head", "chief" adds .edit on top of base modules),
   * and returns suggested permissions in standard format.
   */
  static async suggestPermissions(roleName, tenantId = null) {
    const cleanName = (roleName || '').trim()
    if (!cleanName) {
      return {
        roleName: '',
        matchedKeywords: [],
        permissions: [],
        permissionCodes: [],
        message: 'No matching template found. Please select permissions manually.'
      }
    }

    const templates = await this.getTemplatesForTenant(tenantId)
    const lowerRoleName = cleanName.toLowerCase()

    // 1. Find all matching templates by case-insensitive substring
    const matchedTemplates = []
    const matchedKeywordsSet = new Set()

    for (const t of templates) {
      const kw = (t.keyword || '').toLowerCase().trim()
      if (kw && lowerRoleName.includes(kw)) {
        matchedTemplates.push(t)
        matchedKeywordsSet.add(kw)
      }
    }

    const matchedKeywords = Array.from(matchedKeywordsSet)

    // 2. If no keywords matched
    if (matchedKeywords.length === 0) {
      return {
        roleName: cleanName,
        matchedKeywords: [],
        permissions: [],
        permissionCodes: [],
        message: 'No matching template found. Please select permissions manually.'
      }
    }

    // 3. Evaluate matching rules
    // Permission map: `${module}.${action}` -> { module, action }
    const permissionMap = new Map()

    // Check if an admin / wildcard keyword matched
    const hasWildcardAll = matchedTemplates.some(
      t => t.isWildcard && (t.module === '*' || t.module === 'all') && (t.action === '*' || t.action === 'all')
    )

    if (hasWildcardAll) {
      // Wildcard on all modules: view, create, edit, delete
      for (const mod of ALL_SYSTEM_MODULES) {
        for (const act of ALL_ACTIONS) {
          const key = `${mod}.${act}`
          permissionMap.set(key, { module: mod, action: act })
        }
      }
    } else {
      // Base module collection
      const baseMatchedModules = new Set()

      for (const t of matchedTemplates) {
        // Skip modifier keywords during base module pass
        if (MODIFIER_KEYWORDS.includes((t.keyword || '').toLowerCase().trim()) && t.module === '*') {
          continue
        }

        if (t.isWildcard && (t.action === '*' || t.action === 'all')) {
          for (const act of ALL_ACTIONS) {
            const key = `${t.module}.${act}`
            permissionMap.set(key, { module: t.module, action: act })
            baseMatchedModules.add(t.module)
          }
        } else if (t.module && t.action) {
          const key = `${t.module}.${t.action}`
          permissionMap.set(key, { module: t.module, action: t.action })
          baseMatchedModules.add(t.module)
        }
      }

      // Check for modifier keywords ("senior", "head", "chief")
      const hasSeniorModifier = matchedKeywords.some(kw => MODIFIER_KEYWORDS.includes(kw))

      if (hasSeniorModifier) {
        // Modifier rule: add .edit on top of the base role's matched modules
        for (const mod of baseMatchedModules) {
          // If the base module isn't '*', grant .edit on that module
          if (mod !== '*') {
            const editKey = `${mod}.edit`
            permissionMap.set(editKey, { module: mod, action: 'edit' })
          }
        }
      }
    }

    const permissions = Array.from(permissionMap.values())
    const permissionCodes = Array.from(permissionMap.keys())

    return {
      roleName: cleanName,
      matchedKeywords,
      permissions,
      permissionCodes,
      message: 'Suggested based on role name — review before saving.'
    }
  }

  /**
   * Get all templates for tenant settings page (both tenant custom and global fallback)
   */
  static async listTemplates(tenantId = null) {
    let tenantTemplates = []
    if (tenantId) {
      tenantTemplates = await prisma.roleTemplate.findMany({
        where: { tenantId },
        orderBy: [{ keyword: 'asc' }, { module: 'asc' }, { action: 'asc' }]
      })
    }

    const globalTemplates = await prisma.roleTemplate.findMany({
      where: { tenantId: null },
      orderBy: [{ keyword: 'asc' }, { module: 'asc' }, { action: 'asc' }]
    })

    return {
      tenantTemplates: tenantTemplates.map(t => ({ ...t, isTenantCustom: true })),
      globalTemplates: globalTemplates.map(t => ({ ...t, isTenantCustom: false })),
      isUsingCustom: tenantTemplates.length > 0
    }
  }

  /**
   * Create a new tenant template mapping
   */
  static async createTemplate(tenantId, data) {
    if (!tenantId) {
      throw new Error('Tenant ID is required to create a custom template')
    }
    const cleanKeyword = (data.keyword || '').trim().toLowerCase()
    const cleanModule = (data.module || '').trim().toLowerCase()
    const cleanAction = (data.action || '').trim().toLowerCase()

    if (!cleanKeyword || !cleanModule || !cleanAction) {
      throw new Error('Keyword, module, and action are required')
    }

    const template = await prisma.roleTemplate.create({
      data: {
        tenantId,
        keyword: cleanKeyword,
        module: cleanModule,
        action: cleanAction,
        isWildcard: Boolean(data.isWildcard || cleanModule === '*' || cleanAction === '*')
      }
    })

    return template
  }

  /**
   * Update a template for the tenant
   */
  static async updateTemplate(tenantId, id, data) {
    const existing = await prisma.roleTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('Role template not found')
    }

    // If updating a global template, clone it as a tenant template
    if (!existing.tenantId) {
      return prisma.roleTemplate.create({
        data: {
          tenantId,
          keyword: (data.keyword || existing.keyword).trim().toLowerCase(),
          module: (data.module || existing.module).trim().toLowerCase(),
          action: (data.action || existing.action).trim().toLowerCase(),
          isWildcard: Boolean(data.isWildcard ?? existing.isWildcard)
        }
      })
    }

    // If it belongs to this tenant, update directly
    if (existing.tenantId !== tenantId) {
      throw new Error('Unauthorized to modify template of another clinic')
    }

    return prisma.roleTemplate.update({
      where: { id },
      data: {
        keyword: data.keyword ? data.keyword.trim().toLowerCase() : undefined,
        module: data.module ? data.module.trim().toLowerCase() : undefined,
        action: data.action ? data.action.trim().toLowerCase() : undefined,
        isWildcard: data.isWildcard !== undefined ? Boolean(data.isWildcard) : undefined
      }
    })
  }

  /**
   * Delete a tenant template
   */
  static async deleteTemplate(tenantId, id) {
    const existing = await prisma.roleTemplate.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('Role template not found')
    }

    if (!existing.tenantId || existing.tenantId !== tenantId) {
      throw new Error('Cannot delete global default template')
    }

    await prisma.roleTemplate.delete({
      where: { id }
    })

    return { success: true, message: 'Template deleted successfully' }
  }

  /**
   * Reset tenant templates to global defaults (delete all tenant custom templates)
   */
  static async resetToDefaults(tenantId) {
    if (!tenantId) return { success: true, count: 0 }

    const deleted = await prisma.roleTemplate.deleteMany({
      where: { tenantId }
    })

    return {
      success: true,
      count: deleted.count,
      message: 'Reverted to global default templates'
    }
  }
}

export default RoleTemplateService
