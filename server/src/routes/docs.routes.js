import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { openApiSpec } from '../utils/openapi.js'

const router = Router()

router.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'clinic OS API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}))

export default router
