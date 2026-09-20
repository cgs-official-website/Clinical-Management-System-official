import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  CalendarClock,
  Activity,
  DollarSign,
  Boxes,
  Cpu,
  CheckCircle2,
} from 'lucide-react'

const iconMap = {
  ShieldCheck,
  CalendarClock,
  Activity,
  DollarSign,
  Boxes,
  Cpu,
}

const TiltCard = ({ feature, index }) => {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const multiplier = 18
    setRotateX((-y / (rect.height / 2)) * multiplier)
    setRotateY((x / (rect.width / 2)) * multiplier)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  const Icon = iconMap[feature.icon] || Activity

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      style={{ perspective: 1000 }}
      className="h-full"
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
        className="glass-card h-full p-6 sm:p-7 rounded-2xl flex flex-col justify-between cursor-default transition-transform duration-150 ease-out group relative overflow-hidden"
      >
        {/* Subtle hover gradient illumination */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-text-primary mb-2 tracking-tight group-hover:text-primary transition-colors">
            {feature.title}
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {feature.description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 text-xs font-semibold text-primary">
          <CheckCircle2 className="w-4 h-4" />
          <span>Production Ready</span>
        </div>
      </div>
    </motion.div>
  )
}

export const FeatureGrid = ({ features = [] }) => {
  return (
    <section id="features" className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider mb-4">
            Unified Clinical Suite
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight">
            Engineered for High-Reliability Patient Care
          </h2>
          <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed">
            Every module is decoupled, hardened with role-based policies, and backed by high-throughput REST APIs designed for instant clinician responsiveness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, idx) => (
            <TiltCard key={feature.id || idx} feature={feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeatureGrid
