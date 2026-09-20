export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = null) {
    super(message, 400, 'BAD_REQUEST', details)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 422, 'VALIDATION_ERROR', details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied', requiredPermission = null) {
    super(message, 403, 'PERMISSION_DENIED', requiredPermission ? { requiredPermission } : null)
    this.requiredPermission = requiredPermission
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message = 'Database connection failed. Please check connection settings.') {
    super(message, 503, 'DATABASE_CONNECTION_ERROR')
  }
}

export class TenantPendingApprovalError extends AppError {
  constructor(message = 'Your clinic registration is still under review.', details = null) {
    super(message, 403, 'TENANT_PENDING_APPROVAL', details)
  }
}

export class TenantRejectedError extends AppError {
  constructor(rejectionReason = 'Your clinic registration was not approved.', details = null) {
    super(rejectionReason, 403, 'TENANT_REJECTED', details)
    this.rejectionReason = rejectionReason
  }
}

