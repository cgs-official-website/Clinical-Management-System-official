import React from 'react'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'

export const PricingTiers = ({ pricingTiers = [] }) => {
  return (
    <section id="pricing" className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider mb-4">
            Transparent Pricing
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight">
            Scalable Infrastructure for Modern Healthcare
          </h2>
          <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed">
            Choose the subscription tier tailored to your clinic size. Switch or expand anytime with zero downtime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {pricingTiers.map((tier, idx) => (
            <motion.div
              key={tier.name || idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className={`h-full rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                tier.highlighted
                  ? 'border-2 border-primary bg-surface shadow-glow/20 relative scale-105 z-10 p-8'
                  : 'border border-border bg-surface/50 p-7 hover:border-primary/40'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-primary text-white text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="font-heading font-bold text-xl text-text-primary mb-2">
                  {tier.name}
                </h3>
                <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                  {tier.description}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-heading font-extrabold text-4xl sm:text-5xl text-text-primary">
                    {tier.price}
                  </span>
                  <span className="text-xs text-text-secondary font-medium">
                    {tier.period}
                  </span>
                </div>

                <div className="pt-6 border-t border-border">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider block mb-4">
                    Included Features:
                  </span>
                  <ul className="flex flex-col gap-3">
                    {tier.features?.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-text-secondary">
                        <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6">
                <Link to="/login" className="w-full block">
                  <Button
                    variant={tier.highlighted ? 'primary' : 'secondary'}
                    size="md"
                    className="w-full"
                  >
                    {tier.name.includes('Enterprise') ? 'Contact Architecture Team' : 'Deploy Clinic Instance'}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingTiers
