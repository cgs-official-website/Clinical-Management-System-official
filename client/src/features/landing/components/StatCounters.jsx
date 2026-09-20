import React from 'react'
import { motion } from 'framer-motion'
import { Users, Building2, ShieldCheck, HeartPulse } from 'lucide-react'

export const StatCounters = ({ stats }) => {
  const statItems = [
    {
      label: 'Patients Managed',
      value: stats?.patientsManaged || '4.8M+',
      icon: Users,
      color: 'text-emerald-500',
    },
    {
      label: 'Clinics Onboarded',
      value: stats?.clinicsOnboarded || '1,420+',
      icon: Building2,
      color: 'text-teal-500',
    },
    {
      label: 'System Uptime',
      value: stats?.uptimePercent || '99.99%',
      icon: ShieldCheck,
      color: 'text-primary',
    },
    {
      label: 'Clinician Satisfaction',
      value: stats?.satisfactionRate || '98.6%',
      icon: HeartPulse,
      color: 'text-cyan-500',
    },
  ]

  return (
    <div className="w-full py-8 border-y border-border bg-surface/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {statItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="flex flex-col items-center sm:items-start text-center sm:text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
                <div className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-text-primary tracking-tight">
                  {item.value}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StatCounters
