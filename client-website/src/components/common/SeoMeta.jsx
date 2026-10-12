import React, { useEffect } from 'react'

export const SeoMeta = ({
  title = 'Zuna | Next-Gen AI-Powered Clinical Management System',
  description = 'Production-grade, multi-role Clinical Management System with dynamic role-based access control, intelligent appointment workflows, and real-time clinical intelligence.',
}) => {
  useEffect(() => {
    document.title = title
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute('content', description)
    }
  }, [title, description])

  return null
}

export default SeoMeta
