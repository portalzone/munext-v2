'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Message } from '@/lib/types'

export default function MessageThreadPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params)
  const appId       = Number(applicationId)
  const router      = useRouter()
  const queryClient = useQueryClient()
  const bottomRef   = useRef<HTMLDivElement>(null)
  const attachInputRef = useRef<HTMLInputElement>(null)
  const [body, setBody]           = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
    retry: false,
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['thread', appId],
    queryFn: () => api.messages.thread(appId),
    refetchInterval: 10000,
  })

  // Thread fetch marks messages as read server-side — refresh badge counts whenever data arrives
  useEffect(() => {
    if (data) {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] })
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
      queryClient.invalidateQueries({ queryKey: ['message-unread'] })
    }
  }, [data, queryClient])

  const sendMutation = useMutation({
    mutationFn: () => api.messages.send(appId, body, attachment ?? undefined),
    onSuccess: () => {
      setBody('')
      setAttachment(null)
      queryClient.invalidateQueries({ queryKey: ['thread', appId] })
      queryClient.invalidateQueries({ queryKey: ['message-unread'] })
    },
  })

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.data])

  const messages: Message[] = data?.data ?? []
  const me = meData?.data

  const canSend = (body.trim().length > 0 || attachment !== null) && !sendMutation.isPending

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!canSend) return
    sendMutation.mutate()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) sendMutation.mutate()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setAttachment(file)
    // reset input so same file can be re-selected after clearing
    e.target.value = ''
  }

  function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext ?? '')) return '🖼️'
    if (ext === 'pdf') return '📄'
    return '📎'
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Cannot open this conversation.</p>
          <p className="text-sm text-gray-400">Messaging is only available once your application has been reviewed.</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">Go back</button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900">Application Thread</h1>
          <p className="text-xs text-gray-400">Messages are private between you and the other party.</p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl w-full mx-auto">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="h-12 w-64 bg-gray-200 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-gray-400 text-sm">No messages yet.</p>
            <p className="text-gray-300 text-xs mt-1">Send the first message below.</p>
          </div>
        )}

        {messages.map(msg => {
          const isMine = msg.sender_id === me?.id
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[70%] space-y-1">
                {!isMine && (
                  <p className="text-xs text-gray-400 px-1">{msg.sender?.name ?? 'Unknown'}</p>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-[#1a3a5c] text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.body && (
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                  )}
                  {msg.attachment_url && msg.attachment_name && (
                    <a
                      href={msg.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 mt-2 text-xs underline underline-offset-2 ${
                        isMine ? 'text-blue-200 hover:text-white' : 'text-blue-600 hover:text-blue-800'
                      }`}
                    >
                      <span>{getFileIcon(msg.attachment_name)}</span>
                      <span className="truncate max-w-50">{msg.attachment_name}</span>
                    </a>
                  )}
                </div>
                <p className={`text-xs text-gray-400 px-1 ${isMine ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {new Date(msg.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                  {isMine && msg.read_at && (
                    <span className="ml-1 text-blue-300">· Read</span>
                  )}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Selected file preview */}
          {attachment && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
              <span>{getFileIcon(attachment.name)}</span>
              <span className="flex-1 truncate">{attachment.name}</span>
              <span className="text-blue-400 text-xs shrink-0">
                {(attachment.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-blue-400 hover:text-red-500 transition-colors ml-1"
                aria-label="Remove attachment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2">
            {/* Hidden file input */}
            <input
              ref={attachInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Paperclip button */}
            <button
              type="button"
              onClick={() => attachInputRef.current?.click()}
              className="text-gray-400 hover:text-[#1a3a5c] transition-colors pb-2.5 shrink-0"
              aria-label="Attach file"
              title="Attach file (PDF, DOC, image — max 10 MB)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#15304d] disabled:opacity-40 transition-colors shrink-0"
            >
              {sendMutation.isPending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
