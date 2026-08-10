import { useEffect, useState } from 'react'
import { MessageCircle, Send, Bot, User, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import AdminBackLink from '../../components/AdminBackLink'

interface Conversation {
  id: string
  user_id: string | null
  guest_id: string | null
  guest_name: string | null
  guest_email: string | null
  status: string
  last_message_at: string
  created_at: string
}

interface ChatMessage {
  id: string
  sender: string
  content: string
  created_at: string
}

export default function AdminChat() {
  const { showToast } = useToast()
  const { session } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { loadConversations() }, [])

  useEffect(() => {
    if (selectedId) loadMessages(selectedId)
  }, [selectedId])

  async function loadConversations() {
    setLoading(true)
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
    setConversations((data as Conversation[]) ?? [])
    setLoading(false)
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages((data as ChatMessage[]) ?? [])
  }

  async function sendReply() {
    if (!reply.trim() || !selectedId) return
    setSending(true)
    const { data, error } = await supabase.functions.invoke('chat-assistant', {
      body: JSON.stringify({ action: 'admin_reply', conversation_id: selectedId, message: reply }),
    })
    if (error || data?.error) {
      showToast('Failed to send message', 'error')
    } else {
      setMessages((prev) => [...prev, {
        id: `admin-${Date.now()}`,
        sender: 'admin',
        content: reply,
        created_at: new Date().toISOString(),
      }])
      setReply('')
      showToast('Message sent', 'success')
    }
    setSending(false)
  }

  async function closeConversation(convId: string) {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ status: 'closed' })
      .eq('id', convId)
    if (error) { showToast('Failed to close conversation', 'error'); return }
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, status: 'closed' } : c))
    showToast('Conversation closed', 'success')
  }

  const filtered = conversations.filter((c) => {
    const name = c.guest_name ?? c.guest_email ?? c.guest_id ?? 'Registered user'
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const selectedConv = conversations.find((c) => c.id === selectedId)

  return (
    <div className="section-padding py-8 animate-fade-in">
      <AdminBackLink />
      <h1 className="text-3xl font-serif text-wine-800 mb-8">Customer Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversation list */}
        <div className="lg:col-span-1 card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-cream-200">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-cream-100 rounded-xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-wine-400 py-12 text-sm">No conversations found.</p>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left p-4 border-b border-cream-100 hover:bg-cream-50 transition-colors ${
                    selectedId === conv.id ? 'bg-blush-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-wine-700 text-sm">
                      {conv.guest_name ?? 'Guest'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      conv.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-cream-200 text-wine-400'
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                  <p className="text-xs text-wine-400">
                    {conv.guest_email ?? conv.guest_id?.slice(0, 8) ?? 'Registered user'}
                  </p>
                  <p className="text-xs text-wine-300 mt-1">
                    {new Date(conv.last_message_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-wine-400">
              <MessageCircle size={48} className="mb-3 opacity-40" />
              <p>Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-cream-200 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-wine-700">
                    {selectedConv?.guest_name ?? 'Guest user'}
                  </h3>
                  <p className="text-xs text-wine-400">
                    {selectedConv?.guest_email ?? selectedConv?.guest_id?.slice(0, 12) ?? 'Registered user'}
                  </p>
                </div>
                {selectedConv?.status === 'active' && (
                  <button
                    onClick={() => closeConversation(selectedConv.id)}
                    className="text-xs text-wine-400 hover:text-red-500 transition-colors"
                  >
                    Close conversation
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center shrink-0">
                        <User size={14} className="text-wine-500" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                        msg.sender === 'user'
                          ? 'bg-white text-wine-700 rounded-bl-sm shadow-sm'
                          : msg.sender === 'bot'
                          ? 'bg-wine-100 text-wine-700 rounded-br-sm'
                          : 'bg-wine-700 text-cream-50 rounded-br-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {(msg.sender === 'bot' || msg.sender === 'admin') && (
                      <div className="w-7 h-7 rounded-full bg-wine-100 flex items-center justify-center shrink-0">
                        <Bot size={14} className="text-wine-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-cream-200 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2.5 rounded-full bg-cream-100 text-sm text-wine-700 outline-none focus:ring-2 focus:ring-blush-300"
                    disabled={sending || selectedConv?.status === 'closed'}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim() || selectedConv?.status === 'closed'}
                    className="w-10 h-10 rounded-full bg-wine-700 text-cream-50 flex items-center justify-center hover:bg-wine-800 transition-all disabled:opacity-50 shrink-0"
                    aria-label="Send reply"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
