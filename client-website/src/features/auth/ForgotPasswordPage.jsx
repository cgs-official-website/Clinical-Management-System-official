import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Activity, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
})

export const ForgotPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await api.post('/api/auth/forgot-password', data)
      setIsSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-primary/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-primary/20 p-2 mx-auto flex items-center justify-center mb-4 shadow-glow/20">
            <img
              src="/zuna-logo.png"
              alt="Zuna"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-text-primary">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-2">
            Enter your clinical work email to receive password recovery instructions
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-card border border-border">
          {isSubmitted ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="font-heading font-bold text-base text-text-primary mb-1">
                Recovery Link Dispatched
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6">
                If an authorized clinician record exists for that address, a secure reset token has been issued.
              </p>
              <Link to="/login">
                <Button variant="secondary" size="md" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="clinician@aurahealth.org"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                required
                {...register('email')}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
