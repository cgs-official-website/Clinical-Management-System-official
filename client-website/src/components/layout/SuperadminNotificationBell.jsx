import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Hospital, CheckCircle2, ChevronRight, Check, User, Mail, Clock, CheckCheck } from 'lucide-react'
import { api } from '../../lib/api'
import { notify } from '../ui/Toast'

const READ_STORAGE_KEY = 'superadmin_read_approval_ids'

const getReadIdsFromStorage = () => {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

const saveReadIdsToStorage = (ids) => {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids))
  } catch (e) {}
}

const getItemId = (item) => String(item.id || item.registrationId || item.tenantId || item.subdomain || item.email || '')

export const SuperadminNotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [readIds, setReadIds] = useState(() => getReadIdsFromStorage())
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const prevUnreadCountRef = useRef(null)

  // Fetch notifications from PostgreSQL Database
  const { data: dbNotifData } = useQuery({
    queryKey: ['superadmin', 'db-notifications'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/notifications')
      return res.data
    },
    refetchInterval: 5000,
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false
      return failureCount < 2
    },
  })

  // Fetch current pending registrations as fallback / supplemental data
  const { data: pendingData } = useQuery({
    queryKey: ['superadmin', 'pending-registrations'],
    queryFn: async () => {
      const res = await api.get('/api/superadmin/pending-registrations')
      return res.data
    },
    refetchInterval: 5000,
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false
      return failureCount < 2
    },
  })

  const rawDbNotifications = Array.isArray(dbNotifData?.notifications)
    ? dbNotifData.notifications
    : Array.isArray(dbNotifData?.data)
    ? dbNotifData.data
    : []

  const pendingList = Array.isArray(pendingData?.registrations)
    ? pendingData.registrations
    : Array.isArray(pendingData?.data)
    ? pendingData.data
    : []

  // Combine DB notifications and pending list items
  const combinedList = rawDbNotifications.length > 0
    ? rawDbNotifications.map((notif) => {
        const payload = notif.data || {}
        return {
          id: notif.id,
          notifDbId: notif.id,
          isRead: notif.isRead,
          clinicName: payload.clinicName || notif.title?.replace('New Clinic Registration: ', '') || 'Pending Clinic',
          adminName: payload.adminName || 'Clinic Admin',
          email: payload.email || '',
          submittedAt: notif.createdAt || payload.submittedAt,
        }
      })
    : pendingList.map((item) => ({
        id: getItemId(item),
        notifDbId: null,
        isRead: readIds.includes(getItemId(item)),
        clinicName: item.clinicName || item.name || 'Pending Clinic',
        adminName: item.adminName || item.administrator || 'Clinic Admin',
        email: item.email || item.contactEmail || '',
        submittedAt: item.submittedAt || item.createdAt,
      }))

  // Unread list from DB/state
  const unreadList = combinedList.filter((item) => !item.isRead && !readIds.includes(item.id))
  const unreadCount = unreadList.length

  // Listen to storage events to sync read IDs across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === READ_STORAGE_KEY) {
        setReadIds(getReadIdsFromStorage())
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Toast trigger helper
  const triggerNotificationToast = (clinicName) => {
    const messageText = clinicName
      ? `New clinic registration (${clinicName}) requires approval.`
      : 'A new clinic registration is waiting for your approval.'

    notify.info(messageText, {
      title: '🔔 New Clinic Approval Required',
      duration: 10000,
      action: {
        label: 'Review',
        onClick: () => {
          navigate('/app/superadmin/clinics')
        },
      },
    })

    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 New Clinic Approval Required', {
          body: messageText,
          icon: '/zuna-logo.png',
        })
      }
    } catch (e) {}
  }

  // Real-time synchronization
  useEffect(() => {
    let channel = null
    try {
      channel = new BroadcastChannel('clinic_registration_channel')
      channel.onmessage = (event) => {
        if (event.data?.type === 'REGISTRATION_CREATED') {
          queryClient.invalidateQueries({ queryKey: ['superadmin', 'db-notifications'] })
          queryClient.invalidateQueries({ queryKey: ['superadmin', 'pending-registrations'] })
          triggerNotificationToast(event.data.clinicName)
        }
      }
    } catch (e) {}

    const handleStorage = (e) => {
      if (e.key === 'clinic_last_created_registration' && e.newValue) {
        queryClient.invalidateQueries({ queryKey: ['superadmin', 'db-notifications'] })
        queryClient.invalidateQueries({ queryKey: ['superadmin', 'pending-registrations'] })
        triggerNotificationToast()
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      if (channel) channel.close()
      window.removeEventListener('storage', handleStorage)
    }
  }, [queryClient])

  // Track increases in unreadCount for toast alerts
  useEffect(() => {
    if (prevUnreadCountRef.current !== null && unreadCount > prevUnreadCountRef.current) {
      triggerNotificationToast()
    }
    prevUnreadCountRef.current = unreadCount
  }, [unreadCount])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (item, e) => {
    if (e) e.stopPropagation()
    const itemId = item.id || getItemId(item)
    if (!itemId) return

    // Update local state immediately for snappy UI
    const updated = Array.from(new Set([...readIds, itemId]))
    setReadIds(updated)
    saveReadIdsToStorage(updated)

    // Persist to PostgreSQL if DB notification ID exists
    if (item.notifDbId) {
      try {
        await api.patch(`/api/superadmin/notifications/${item.notifDbId}/read`)
        queryClient.invalidateQueries({ queryKey: ['superadmin', 'db-notifications'] })
      } catch (err) {
        console.error('Error updating notification read status in DB:', err)
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    const allIds = combinedList.map((item) => item.id).filter(Boolean)
    const updated = Array.from(new Set([...readIds, ...allIds]))
    setReadIds(updated)
    saveReadIdsToStorage(updated)

    // Persist mark all as read to PostgreSQL
    try {
      await api.post('/api/superadmin/notifications/mark-all-read')
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'db-notifications'] })
    } catch (err) {
      console.error('Error marking all notifications read in DB:', err)
    }
  }

  const handleNavigateToClinics = () => {
    setIsOpen(false)
    navigate('/app/superadmin/clinics')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Superadmin notification/bell icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-border bg-surface/80 hover:bg-surface text-text-secondary hover:text-text-primary transition-all focus:outline-none shadow-sm flex items-center justify-center"
        title="Unread Approval Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        
        {/* Red unread-count badge: ONLY shows when unreadCount > 0 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Dropdown Header */}
          <div className="p-4 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Hospital className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-text-primary truncate">Pending Approval Notifications</h3>
                <p className="text-[11px] font-medium text-amber-500 truncate">
                  {unreadCount === 0
                    ? 'No unread notifications'
                    : `${unreadCount} Unread New Approval${unreadCount === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 shrink-0"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Unread Notifications List Body */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
            {unreadCount === 0 ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto opacity-80" />
                <p className="text-xs font-semibold text-text-primary">All Notifications Read</p>
                <p className="text-[11px] text-text-secondary">
                  You have read all new approval notifications.
                </p>
              </div>
            ) : (
              unreadList.map((item, index) => {
                const clinicName = item.clinicName || item.name || 'Pending Clinic'
                const adminName = item.adminName || item.administrator || 'Clinic Admin'
                const email = item.email || item.contactEmail || ''
                const dateStr = item.submittedAt
                  ? new Date(item.submittedAt).toLocaleDateString()
                  : item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString()
                  : 'Just now'

                return (
                  <div
                    key={getItemId(item) || index}
                    onClick={handleNavigateToClinics}
                    className="p-3.5 hover:bg-surface-hover/70 transition-colors cursor-pointer group flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-danger shrink-0 animate-pulse" title="Unread" />
                        <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                          {clinicName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 uppercase">
                          New Approval
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-text-secondary">
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 shrink-0 text-text-secondary" />
                          {adminName}
                        </span>
                        {email && (
                          <span className="flex items-center gap-1 truncate hidden xs:flex">
                            <Mail className="w-3 h-3 shrink-0 text-text-secondary" />
                            {email}
                          </span>
                        )}
                      </div>

                      <div className="text-[9.5px] text-text-secondary/80 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Submitted {dateStr}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 self-center">
                      <button
                        onClick={(e) => handleMarkAsRead(item, e)}
                        className="px-2 py-1 rounded-lg bg-surface border border-border text-text-secondary hover:text-success hover:border-success/40 hover:bg-success/10 transition-all text-[10px] font-semibold flex items-center gap-1"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3 text-success" />
                        <span>Mark as read</span>
                      </button>

                      <span className="p-1 rounded-lg text-text-secondary group-hover:text-primary transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperadminNotificationBell
