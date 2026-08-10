import { useEffect, useState } from 'react'
import { Trash2, Search, Mail, MailOpen, X } from 'lucide-react'
import { supabase, type ContactMessage } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

export default function AdminMessages() {
  const { showToast } = useToast()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<ContactMessage | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    setMessages((data as ContactMessage[]) ?? [])
    setLoading(false)
  }

  const filtered = messages.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
  )

  const unreadCount = messages.filter((m) => !m.is_read).length

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ is_read: true })
      .eq('id', id)
    if (error) {
      showToast('Failed to mark as read', 'error')
      return
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
    )
    setViewing((prev) => (prev?.id === id ? { ...prev, is_read: true } : prev))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message? This cannot be undone.')) return
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id)
    if (error) {
      showToast('Failed to delete message', 'error')
    } else {
      showToast('Message deleted', 'success')
      setViewing(null)
      await load()
    }
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-wine-800">Contact Messages</h1>
        <p className="text-sm text-wine-400 mt-1">
          {messages.length} total message{messages.length !== 1 ? 's' : ''}
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-blush-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-blush-500" /> {unreadCount} unread
            </span>
          )}
        </p>
      </div>

      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or subject..."
          className="input-field pl-10 max-w-md"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-cream-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <button
              key={msg.id}
              onClick={() => {
                setViewing(msg)
                if (!msg.is_read) markRead(msg.id)
              }}
              className={`card p-4 w-full text-left flex items-start gap-4 hover:shadow-md transition-shadow ${
                !msg.is_read ? 'border-l-4 border-l-blush-400' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.is_read
                    ? 'bg-cream-200 text-wine-400'
                    : 'bg-blush-100 text-blush-600'
                }`}
              >
                {msg.is_read ? <MailOpen size={18} /> : <Mail size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p
                    className={`text-wine-800 truncate ${
                      !msg.is_read ? 'font-semibold' : 'font-medium'
                    }`}
                  >
                    {msg.name}
                  </p>
                  <span className="text-xs text-wine-400 shrink-0">
                    {new Date(msg.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <p className="text-sm text-wine-600 truncate mb-0.5">
                  {msg.subject}
                </p>
                <p className="text-xs text-wine-400 truncate">{msg.message}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Mail size={32} className="text-wine-300 mx-auto mb-3" />
          <p className="text-wine-400">No messages yet.</p>
        </div>
      )}

      {/* Message detail modal */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-cream-50 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif text-wine-800">Message Details</h2>
              <button
                onClick={() => setViewing(null)}
                className="text-wine-400 hover:text-wine-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-wine-400 uppercase tracking-wide mb-0.5">From</p>
                <p className="text-wine-800 font-medium">{viewing.name}</p>
                <p className="text-sm text-wine-500">{viewing.email}</p>
              </div>
              <div>
                <p className="text-xs text-wine-400 uppercase tracking-wide mb-0.5">Subject</p>
                <p className="text-wine-800">{viewing.subject}</p>
              </div>
              <div>
                <p className="text-xs text-wine-400 uppercase tracking-wide mb-0.5">Received</p>
                <p className="text-sm text-wine-500">
                  {new Date(viewing.created_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="border-t border-cream-200 pt-3">
                <p className="text-xs text-wine-400 uppercase tracking-wide mb-1">Message</p>
                <p className="text-wine-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {viewing.message}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-cream-200">
              <a
                href={`mailto:${viewing.email}?subject=Re: ${encodeURIComponent(
                  viewing.subject
                )}`}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Mail size={16} /> Reply
              </a>
              <button
                onClick={() => handleDelete(viewing.id)}
                className="btn-outline text-red-500 border-red-300 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
