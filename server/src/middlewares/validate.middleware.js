export const validateRequest = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body)
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query)
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params)
      }
      next()
    } catch (error) {
      if (error.errors) {
        const formatted = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: formatted
          }
        })
      }
      next(error)
    }
  }
}
