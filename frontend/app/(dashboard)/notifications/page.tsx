'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AppNotification } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: AppNotification
  onMarkRead: (id: number) => void
}) {
  const isUnread = !notification.read_at

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
        isUnread
          ? 'bg-blue-50 border-blue-100'
          : 'bg-white border-gray-100'
      }`}
    >
      <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${isUnread ? 'bg-[#1a3a5c]' : 'bg-transparent'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo(notification.created_at)}</p>
      </div>
      {isUnread && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="shrink-0 text-xs text-[#1a3a5c] hover:underline"
        >
          Mark read
        </button>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.notifications.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = data?.data ?? []
  const unreadCount   = data?.unread_count ?? 0

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-sm text-[#1a3a5c] font-medium hover:underline disabled:opacity-50"
            >
              {markAllMutation.isPending ? 'Marking...' : 'Mark all as read'}
            </button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-red-600 font-medium">Failed to load notifications.</p>
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p className="text-gray-500 font-medium">No notifications yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              You will be notified when your application status changes.
            </p>
          </div>
        )}

        {!isLoading && !isError && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={(id) => markReadMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
