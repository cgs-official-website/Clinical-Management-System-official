import React, { Suspense, lazy } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Shield, Lock, CheckCircle2, RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'
import { PublicNavbar } from '../../components/layout/PublicNavbar'
import { PublicFooter } from '../../components/layout/PublicFooter'
import { Button } from '../../components/ui/Button'
import { SeoMeta } from '../../components/common/SeoMeta'
import { Skeleton } from '../../components/ui/Skeleton'

// Lazy-load below-the-fold components and 3D canvas for performance optimization
const Hero3DCanvas = lazy(() => import('./components/Hero3DCanvas'))
const StatCounters = lazy(() => import('./components/StatCounters').then((m) => ({ default: m.StatCounters })))
const FeatureGrid = lazy(() => import('./components/FeatureGrid').then((m) => ({ default: m.FeatureGrid })))
const WorkflowShowcase = lazy(() => import('./components/WorkflowShowcase').then((m) => ({ default: m.WorkflowShowcase })))
const PricingTiers = lazy(() => import('./components/PricingTiers').then((m) => ({ default: m.PricingTiers })))
const FaqAccordion = lazy(() => import('./components/FaqAccordion').then((m) => ({ default: m.FaqAccordion })))

export const LandingPage = () => {
  const { data: content, isLoading, isError, refetch } = useQuery({
    queryKey: ['public', 'site-content'],
    queryFn: async () => {
      const res = await api.get('/api/public/site-content')
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col justify-between p-6">
        <PublicNavbar />
        <div className="max-w-7xl mx-auto w-full pt-32 pb-20 flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-48 rounded-full" />
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-20 w-3/4 rounded-xl" />
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-12 w-36 rounded-xl" />
                <Skeleton className="h-12 w-36 rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
        <PublicFooter />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl border border-danger/30 bg-surface">
          <h2 className="text-xl font-bold text-text-primary mb-2">Service Temporarily Unavailable</h2>
          <p className="text-xs text-text-secondary mb-6">
            Unable to connect to the public clinical gateway. Please verify the API connectivity.
          </p>
          <Button variant="primary" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  const { hero, stats, features, workflowSteps, pricingTiers, faqs } = content || {}

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col selection:bg-primary/20">
      <SeoMeta
        title="Zuna | Next-Gen AI-Powered Clinical Management System"
        description="Enterprise Clinical Management System featuring dynamic role-based access control, intelligent calendar scheduling, and real-time clinical workflows."
      />

      {/* Sticky Glass Navbar */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Subtle mesh backdrop glow */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-7 flex flex-col items-start text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/25 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{hero?.badge || 'Next-Gen Clinical Intelligence OS'}</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-text-primary tracking-tight leading-[1.12] mb-6">
                Precision Healthcare{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-400 to-emerald-400">
                  Operations
                </span>
                , Engineered for the Future.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8 max-w-2xl">
                {hero?.subtitle ||
                  'Unify clinical scheduling, zero-trust granular permissions, smart EHR charts, and financial analytics in a single ultra-responsive platform.'}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full sm:w-auto shadow-glow/50 hover:shadow-glow font-bold"
                  >
                    New Register
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
                <a href="#features" className="w-full sm:w-auto">
                  <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                    {hero?.secondaryCta || 'Architecture'}
                  </Button>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 pt-8 border-t border-border/80 flex flex-wrap items-center gap-6 text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <span>End-to-End Encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Dynamic Multi-Tenant RBAC</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: 3D Canvas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative w-full h-[400px] sm:h-[480px] lg:h-[540px] rounded-3xl border border-border/60 glass-panel shadow-card overflow-hidden flex items-center justify-center"
            >
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                    <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span className="text-xs text-text-secondary font-medium">
                      Initializing 3D Molecular Simulation...
                    </span>
                  </div>
                }
              >
                <Hero3DCanvas />
              </Suspense>

              {/* Floating glass metadata card */}
              <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl glass-card border border-border/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  <span className="text-xs font-semibold text-text-primary">
                    Real-Time FHIR Core Active
                  </span>
                </div>
                <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  v2.4 LTS
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Dynamic Stats Bar */}
      <Suspense fallback={<div className="h-28 py-8 flex items-center justify-center"><Skeleton className="h-16 w-3/4 rounded-2xl" /></div>}>
        <StatCounters stats={stats} />
      </Suspense>

      {/* Feature Grid with 3D Tilt Cards */}
      <Suspense fallback={<div className="h-80 py-16 flex items-center justify-center"><Skeleton className="h-64 w-4/5 rounded-3xl" /></div>}>
        <FeatureGrid features={features} />
      </Suspense>

      {/* Dynamic Workflow Showcase */}
      <Suspense fallback={<div className="h-80 py-16 flex items-center justify-center"><Skeleton className="h-64 w-4/5 rounded-3xl" /></div>}>
        <WorkflowShowcase workflowSteps={workflowSteps} />
      </Suspense>

      {/* Pricing Tiers */}
      <Suspense fallback={<div className="h-80 py-16 flex items-center justify-center"><Skeleton className="h-64 w-4/5 rounded-3xl" /></div>}>
        <PricingTiers pricingTiers={pricingTiers} />
      </Suspense>

      {/* FAQ Accordion */}
      <Suspense fallback={<div className="h-64 py-16 flex items-center justify-center"><Skeleton className="h-48 w-3/5 rounded-2xl" /></div>}>
        <FaqAccordion faqs={faqs} />
      </Suspense>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  )
}

export default LandingPage
