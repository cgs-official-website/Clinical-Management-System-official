export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'clinic OS — Clinical Management System REST API',
    version: '1.0.0',
    description: `Production-grade REST API backend with dynamic database-driven RBAC engine, multi-tenant isolation, real-time cache invalidation, and INR billing support.`
  },
  servers: [
    { url: '/api', description: 'API Mount Path' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'System Healthcheck',
        responses: {
          200: { description: 'API operational' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Staff & Admin Login',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@aurahealth.com' },
                  password: { type: 'string', example: 'Admin@12345' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get Current User Profile & Effective Permissions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile with dynamic roles and permissions' }
        }
      }
    },
    '/admin/modules': {
      get: {
        summary: 'List All Dynamic Modules and Actions',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dynamic RBAC matrix modules' } }
      }
    },
    '/admin/roles': {
      get: {
        summary: 'List Roles for Tenant',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of roles' } }
      }
    },
    '/patients': {
      get: {
        summary: 'List Clinic Patients (Requires patients.view)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Paginated patients list' } }
      }
    },
    '/invoices': {
      get: {
        summary: 'List Clinic Invoices in INR (Requires billing.view)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Paginated invoices list in INR (₹)' } }
      }
    }
  }
}

export default openApiSpec
