import { useEffect, useState } from 'react'
import { Trash2, Search, Download, Mail, Send, X, Users } from 'lucide-react'
import { supabase, type Subscriber } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import AdminBackLink from '../../components/AdminBackLink'

export default function AdminSubscribers() {
  const { showToast } = useToast()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [composeMode, setComposeMode] = useState<'single' | 'broadcast'>('single')
  const [composeTo, setComposeTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false })
    setSubscribers((data as Subscriber[]) ?? [])
    setLoading(false)
  }

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subscriber?')) return
    const { error } = await supabase.from('subscribers').delete().eq('id', id)
    if (error) {
      showToast('Failed to remove subscriber', 'error')
    } else {
      showToast('Subscriber removed', 'success')
      await load()
    }
  }

  const exportCSV = () => {
    const csv = ['email,subscribed_date']
      .concat(
        filtered.map(
          (s) =>
            `${s.email},${new Date(s.created_at).toLocaleDateString('en-GB')}`
        )
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const openSingleCompose = (email: string) => {
    setComposeMode('single')
    setComposeTo(email)
    setSubject('')
    setBody('')
    setShowCompose(true)
  }

  const openBroadcastCompose = () => {
    if (subscribers.length === 0) {
      showToast('No subscribers to email', 'error')
      return
    }
    setComposeMode('broadcast')
    setComposeTo('')
    setSubject('')
    setBody('')
    setShowCompose(true)
  }

  const sendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      showToast('Subject and message are required', 'error')
      return
    }

    setSending(true)
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) {
        showToast('Authentication required', 'error')
        setSending(false)
        return
      }

      const recipients =
        composeMode === 'broadcast'
          ? subscribers.map((s) => s.email)
          : [composeTo]

      const htmlBody = body
        .split('\n')
        .map((line) => `<p style="margin:0 0 12px;line-height:1.6">${line || '&nbsp;'}</p>`)
        .join('')

      const response = await fetch(
        `${(import.meta as unknown as Record<string, Record<string, string>>).env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: recipients,
            subject,
            html: htmlBody,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || result.error) {
        const errMsg = result.error || `Request failed (${response.status})`
        if (errMsg.includes('RESEND_API_KEY') || errMsg.includes('Resend API key')) {
          showToast(
            'Resend API key not set. Add it in Supabase edge function secrets.',
            'error'
          )
        } else if (errMsg.includes('Resend API error')) {
          showToast('Resend rejected the email. Check your sender domain.', 'error')
        } else {
          showToast(errMsg, 'error')
        }
        setSending(false)
        return
      }

      showToast(
        composeMode === 'broadcast'
          ? `Email sent to ${recipients.length} subscribers`
          : 'Email sent successfully',
        'success'
      )
      setShowCompose(false)
      setSubject('')
      setBody('')
    } catch {
      showToast('Failed to send email. Please try again.', 'error')
    }
    setSending(false)
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <AdminBackLink />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-wine-800">Subscribers</h1>
          <p className="text-sm text-wine-400 mt-1">
            {subscribers.length} total subscriber{subscribers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {subscribers.length > 0 && (
            <button
              onClick={openBroadcastCompose}
              className="btn-primary flex items-center gap-2"
            >
              <Send size={18} /> Broadcast Email
            </button>
          )}
          {subscribers.length > 0 && (
            <button
              onClick={exportCSV}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} /> Export CSV
            </button>
          )}
        </div>
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
          placeholder="Search by email..."
          className="input-field pl-10 max-w-md"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-cream-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100">
              <tr>
                <th className="text-left py-3 px-4 text-wine-700">Email</th>
                <th className="text-left py-3 px-4 text-wine-700 hidden sm:table-cell">
                  Subscribed
                </th>
                <th className="text-right py-3 px-4 text-wine-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-t border-cream-200 hover:bg-cream-50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-wine-400 shrink-0" />
                      <span className="text-wine-800">{sub.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-wine-500 hidden sm:table-cell">
                    {new Date(sub.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openSingleCompose(sub.email)}
                        className="p-2 rounded-lg hover:bg-blush-100 text-blush-600"
                        aria-label="Send email"
                        title="Send email"
                      >
                        <Send size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-500"
                        aria-label="Remove subscriber"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Mail size={32} className="text-wine-300 mx-auto mb-3" />
          <p className="text-wine-400">No subscribers yet.</p>
        </div>
      )}

      {/* Compose Email Modal */}
      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !sending && setShowCompose(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-cream-50 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-serif text-wine-800 flex items-center gap-2">
                {composeMode === 'broadcast' ? (
                  <>
                    <Users size={20} /> Broadcast Email
                  </>
                ) : (
                  <>
                    <Send size={20} /> Send Email
                  </>
                )}
              </h2>
              <button
                onClick={() => !sending && setShowCompose(false)}
                className="text-wine-400 hover:text-wine-600 disabled:opacity-50"
                disabled={sending}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-wine-400 uppercase tracking-wide mb-1 block">
                  To
                </label>
                {composeMode === 'broadcast' ? (
                  <div className="input-field bg-cream-100 text-wine-500 text-sm">
                    All {subscribers.length} subscribers
                  </div>
                ) : (
                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    disabled
                    className="input-field text-sm"
                  />
                )}
              </div>

              <div>
                <label className="text-xs text-wine-400 uppercase tracking-wide mb-1 block">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="input-field"
                  disabled={sending}
                />
              </div>

              <div>
                <label className="text-xs text-wine-400 uppercase tracking-wide mb-1 block">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here..."
                  rows={8}
                  className="input-field resize-y"
                  disabled={sending}
                />
                <p className="text-xs text-wine-400 mt-1">
                  Line breaks are preserved. Recipients see this as plain text.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-cream-200">
              <button
                onClick={sendEmail}
                disabled={sending || !subject.trim() || !body.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={16} />
                {sending
                  ? 'Sending...'
                  : composeMode === 'broadcast'
                    ? `Send to ${subscribers.length} subscribers`
                    : 'Send Email'}
              </button>
              <button
                onClick={() => setShowCompose(false)}
                disabled={sending}
                className="btn-outline flex items-center gap-2 disabled:opacity-50"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default AdminSubscribers