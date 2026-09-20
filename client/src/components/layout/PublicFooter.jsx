import React, { useState } from 'react'
import { Activity, Mail, ArrowRight, Shield, Heart } from 'lucide-react'
import { Button } from '../ui/Button'
import { api } from '../../lib/api'
import { notify } from '../ui/Toast'

export const PublicFooter = () => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleNewsletter = async (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      const res = await api.post('/api/public/newsletter', { email })
      notify.success(res.data.message || 'Subscribed successfully!')
      setEmail('')
    } catch (err) {
      notify.error('Failed to subscribe. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <footer className="border-t border-border bg-surface/80 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-border">
          {/* Col 1: Brand */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-surface border border-primary/20 p-1.5 shadow-glow/20 flex items-center justify-center">
                <img
                  src="/zuna-logo.png"
                  alt="Zuna Logo"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
                Zuna<span className="text-primary">.</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Enterprise Clinical Management System built for health systems, multi-specialty practices, and high-concurrency clinical networks.
            </p>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Shield className="w-4 h-4 text-primary" />
              <span>HIPAA & SOC-2 Type II Certified Architecture</span>
            </div>
          </div>

          {/* Col 2: Clinical Modules */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Clinical Modules
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-text-secondary">
              <li><a href="#features" className="hover:text-primary transition-colors">Patient Electronic Health Charts</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Intelligent Calendar Scheduling</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Prescriptions & Clinical Notes</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">CPT & Insurance Invoicing</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Pharmacy & Consumables Inventory</a></li>
            </ul>
          </div>

          {/* Col 3: Architecture & Security */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Governance & Security
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-text-secondary">
              <li><a href="#workflow" className="hover:text-primary transition-colors">Dynamic RBAC Permission Engine</a></li>
              <li><a href="#workflow" className="hover:text-primary transition-colors">Audit Trail & Forensic Logs</a></li>
              <li><a href="#workflow" className="hover:text-primary transition-colors">Multi-Tenant Clinic Partitioning</a></li>
              <li><a href="#workflow" className="hover:text-primary transition-colors">FHIR v4 / HL7 Interoperability</a></li>
              <li><a href="#workflow" className="hover:text-primary transition-colors">Cluster Health Observability</a></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Clinical Intelligence Briefing
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Subscribe to quarterly updates on healthcare cybersecurity, FHIR standard evolutions, and RBAC patterns.
            </p>
            <form onSubmit={handleNewsletter} className="flex flex-col gap-2">
              <div className="relative">
                <Mail className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@clinic.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface border border-border text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submitting}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <p>© {new Date().getFullYear()} Zuna . Engineered for high-reliability medical workflows.</p>
          <div className="flex items-center gap-6">
            <a href="#faq" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#faq" className="hover:text-primary transition-colors">BAA Terms</a>
            <a href="#faq" className="hover:text-primary transition-colors">System Status</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter
