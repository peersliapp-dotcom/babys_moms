import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function SignUp() {
  const { signUp } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    setLoading(true)
    const { error } = await signUp(email, password, fullName)
    if (error) {
      showToast(error, 'error')
    } else {
      showToast("Account created! Welcome to Baby's and Mom's.", 'success')
      navigate('/account')
    }
    setLoading(false)
  }

  return (
    <div className="section-padding py-12 max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-wine-800 mb-2">Join Our Family</h1>
        <p className="text-wine-400 text-sm">Create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="text-sm text-wine-600 mb-1.5 block">Full Name</label>
          <div className="relative">
            <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field pl-10"
              placeholder="Your name"
              required
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-wine-600 mb-1.5 block">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-10"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-wine-600 mb-1.5 block">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10 pr-10"
              placeholder="At least 6 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-400 hover:text-wine-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-wine-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-blush-500 hover:text-blush-600 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
