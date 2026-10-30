import React from 'react'
import { Select } from '../../../components/ui/Select'
import { usePatientList } from '../dentalApi'

/**
 * Shared patient dropdown for all dental pages.
 * allowAll=true adds an "All patients" option (used by list pages like X-Ray / Lab Orders).
 */
export const PatientPicker = ({ value, onChange, allowAll = false, label = 'Patient', className = '' }) => {
  const { data: patients = [], isLoading } = usePatientList()

  return (
    <div className={className}>
      <Select
        label={label}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
      >
        <option value="">{isLoading ? 'Loading patients…' : allowAll ? 'All patients' : 'Select a patient'}</option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.fullName || p.name} {p.mrn ? `(${p.mrn})` : ''}
          </option>
        ))}
      </Select>
    </div>
  )
}

export default PatientPicker
