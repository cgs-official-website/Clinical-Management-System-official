import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ShieldCheck, ArrowRight, Menu, X } from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Button } from '../ui/Button'

export const PublicNavbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled
        ? 'glass-nav py-3 shadow-soft'
        : 'bg-transparent py-5 border-b border-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-surface border border-primary/20 p-1.5 shadow-glow/25 group-hover:shadow-glow/50 group-hover:scale-105 transition-all flex items-center justify-center">
            <img
              src="/zuna-logo.png"
              alt="Zuna Logo"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
              Zuna<span className="text-primary">.</span>
            </span>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold -mt-1">

            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
          <a
            href="#features"
            className="hover:text-primary transition-colors focus:outline-none"
          >
            Modules
          </a>
          <a
            href="#workflow"
            className="hover:text-primary transition-colors focus:outline-none"
          >
            Security & RBAC
          </a>
          <a
            href="#pricing"
            className="hover:text-primary transition-colors focus:outline-none"
          >
            Enterprise Plans
          </a>
          <a
            href="#faq"
            className="hover:text-primary transition-colors focus:outline-none"
          >
            Architecture FAQ
          </a>
        </nav>

        {/* Action Controls & Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button
              variant="primary"
              size="sm"
              className="font-bold shadow-glow hover:shadow-glow/80"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              New Register
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-border text-text-secondary hover:text-text-primary bg-surface"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden glass-nav border-b border-border px-6 py-5 flex flex-col gap-4">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-text-secondary hover:text-primary py-1"
          >
            Modules
          </a>
          <a
            href="#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-text-secondary hover:text-primary py-1"
          >
            Security & RBAC
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-text-secondary hover:text-primary py-1"
          >
            Enterprise Plans
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-text-secondary hover:text-primary py-1"
          >
            Architecture FAQ
          </a>
          <div className="pt-3 border-t border-border/80 flex flex-col gap-2.5">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <Button variant="outline" size="sm" className="w-full justify-center">
                Sign In
              </Button>
            </Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <Button variant="primary" size="sm" className="w-full justify-center shadow-glow">
                New Register
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default PublicNavbar
