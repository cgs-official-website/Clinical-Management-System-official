import React from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, UserCheck, KeyRound, Stethoscope, ArrowRight } from 'lucide-react'

export const WorkflowShowcase = ({ workflowSteps = [] }) => {
  const steps = [
    {
      role: 'Superadmin',
      subtitle: 'Multi-Tenant Provisioning',
      icon: ShieldAlert,
      badge: 'Platform Level',
      desc: 'Provisions clinic tenants, monitors real-time system health, and manages enterprise billing & audit streams.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      role: 'Clinic Admin',
      subtitle: 'Operational Configuration',
      icon: UserCheck,
      badge: 'Tenant Level',
      desc: 'Configures clinical departments, operating hours, doctors specialties, and invites clinical staff.',
      color: 'from-teal-500 to-cyan-600',
    },
    {
      role: 'Roles & Permissions',
      subtitle: 'Dynamic Security Gateway',
      icon: KeyRound,
      badge: 'Authorization Core',
      desc: 'Configurable dynamic matrix mapping View, Create, Edit, Delete, Export across all clinical entities.',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      role: 'Clinical Staff',
      subtitle: 'Care Delivery & Execution',
      icon: Stethoscope,
      badge: 'Runtime Level',
      desc: 'Doctors, receptionists, nurses, and billers work in tailored interfaces showing only granted features.',
      color: 'from-blue-500 to-emerald-600',
    },
  ]

  return (
    <section id="workflow" className="py-20 lg:py-28 bg-surface/30 border-y border-border relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider mb-4">
            End-to-End Governance
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight">
            Role-Based Multi-Tier Architecture
          </h2>
          <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed">
            From multi-tenant cluster management down to bedside nurse charting, every action is guarded by zero-trust dynamic permissions.
          </p>
        </div>

        {/* Animated Process Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.5 }}
                className="relative flex flex-col"
              >
                {/* Connector Arrow for desktop */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-12 -translate-y-1/2 z-20 text-primary/40">
                    <ArrowRight className="w-6 h-6 animate-pulse" />
                  </div>
                )}

                <div className="glass-card h-full p-6 rounded-2xl border border-border flex flex-col justify-between group hover:border-primary/50 transition-all">
                  <div>
                    {/* Step indicator */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr text-white flex items-center justify-center shadow-md shadow-primary/20 bg-primary">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {step.badge}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-text-primary mb-1">
                      {step.role}
                    </h3>
                    <h4 className="text-xs font-semibold text-primary mb-3">
                      {step.subtitle}
                    </h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-text-secondary">
                    <span>Phase 0{idx + 1}</span>
                    <span className="font-semibold text-primary">Active Gate</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default WorkflowShowcase
