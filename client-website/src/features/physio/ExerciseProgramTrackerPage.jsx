import React, { useState } from 'react'
import {
  Activity,
  Plus,
  CheckCircle,
  Circle,
  Dumbbell,
  Play,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  Flame,
} from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { notify } from '../../components/ui/Toast'

export const ExerciseProgramTrackerPage = () => {
  const [exercises, setExercises] = useState([
    {
      id: 'ex-1',
      name: 'Isometric Quadriceps Sets',
      target: 'Knee Extensors / VMO',
      sets: 3,
      reps: '15 reps (5s hold)',
      resistance: 'Bodyweight + Towel Roll',
      frequency: '2x Daily',
      completedToday: true,
      difficulty: 'Moderate',
      adherenceRate: 94,
    },
    {
      id: 'ex-2',
      name: 'Theraband Scapular Retraction',
      target: 'Middle Trapezius & Rhomboids',
      sets: 3,
      reps: '12 reps (3s hold)',
      resistance: 'Green Theraband (Medium)',
      frequency: 'Daily',
      completedToday: true,
      difficulty: 'Easy',
      adherenceRate: 88,
    },
    {
      id: 'ex-3',
      name: 'Prone Cervical Retraction (Chin Tucks)',
      target: 'Deep Neck Flexors',
      sets: 4,
      reps: '10 reps (5s hold)',
      resistance: 'Gravity Eliminated',
      frequency: '3x Daily',
      completedToday: false,
      difficulty: 'Easy',
      adherenceRate: 75,
    },
    {
      id: 'ex-4',
      name: 'Single Leg Balance on Foam Pad',
      target: 'Proprioception & Ankle Stabilizers',
      sets: 3,
      reps: '30s hold per leg',
      resistance: 'Airex Balance Pad',
      frequency: 'Daily',
      completedToday: false,
      difficulty: 'Hard',
      adherenceRate: 82,
    },
  ])

  const toggleCompletion = (id) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, completedToday: !e.completedToday } : e
      )
    )
    notify.success('Exercise status updated')
  }

  const completedCount = exercises.filter((e) => e.completedToday).length
  const completionPercent = Math.round((completedCount / exercises.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-text-primary">
              Exercise Program Tracker
            </h1>
            <Badge variant="primary" size="sm">
              Home & Clinic HEP
            </Badge>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Prescribed therapeutic routines, sets, reps, resistance progression and adherence logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => notify.info('Exercise regimen PDF printed.')}
          >
            Print Regimen
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => notify.success('Exercise Prescription dialog opened')}
          >
            Prescribe Exercise
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase">Today's Adherence</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-heading font-bold text-text-primary">
              {completedCount} / {exercises.length}
            </span>
            <span className="text-sm font-bold text-primary">{completionPercent}%</span>
          </div>
          <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase">Weekly Compliance</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-heading font-bold text-text-primary">87.2%</span>
            <Badge variant="success" size="xs">
              <TrendingUp className="w-3 h-3 mr-1" /> +4.5%
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-3">Target: 80% minimum compliance</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <span className="text-xs font-semibold text-text-muted uppercase">Active Prescriptions</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-heading font-bold text-text-primary">4 Exercises</span>
            <Badge variant="primary" size="xs">
              <Flame className="w-3 h-3 mr-1" /> Level 2 Routine
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-3">Next review: 3 days</p>
        </div>
      </div>

      {/* Exercise Routine Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-heading font-semibold text-sm text-text-primary">
            Active Therapeutic Routines
          </h3>
          <span className="text-xs text-text-muted">Click row check to log completion</span>
        </div>

        <div className="divide-y divide-border">
          {exercises.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-bg/40 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  onClick={() => toggleCompletion(item.id)}
                  className="mt-0.5 text-text-muted hover:text-primary transition-colors shrink-0"
                >
                  {item.completedToday ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-heading font-semibold text-sm ${
                      item.completedToday ? 'line-through text-text-muted' : 'text-text-primary'
                    }`}>
                      {item.name}
                    </span>
                    <Badge variant="outline" size="xs">
                      {item.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">Target: {item.target}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-6 pl-8 sm:pl-0 text-xs text-text-secondary">
                <div>
                  <span className="text-text-muted block">Sets & Reps</span>
                  <span className="font-semibold text-text-primary">{item.sets} × {item.reps}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Resistance</span>
                  <span className="font-semibold text-text-primary">{item.resistance}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Frequency</span>
                  <span className="font-semibold text-text-primary">{item.frequency}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Adherence</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.adherenceRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExerciseProgramTrackerPage
