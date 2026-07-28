import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { signIn } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      showToast(error, 'error')
    } else {
      showToast('Welcome back!', 'success')
      navigate('/account')
    }
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { showToast('Enter your email', 'error'); return }
    setResetting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) {
      showToast('Failed to send reset email', 'error')
    } else {
      setResetSent(true)
      showToast('Reset link sent! Check your email.', 'success')
    }
    setResetting(false)
  }

  return (
    <div className="section-padding py-12 max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-wine-800 mb-2">
          {resetMode ? 'Reset Password' : 'Welcome Back'}
        </h1>
        <p className="text-wine-400 text-sm">
          {resetMode ? 'Enter your email to receive a reset link' : 'Sign in to your account'}
        </p>
      </div>

      {resetMode ? (
        resetSent ? (
          <div className="card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-green-600" />
            </div>
            <h2 className="text-xl font-serif text-wine-800 mb-2">Check Your Email</h2>
            <p className="text-wine-500 text-sm mb-6">We've sent a password reset link to <strong>{email}</strong>. Follow the link in the email to reset your password.</p>
            <button onClick={() => { setResetMode(false); setResetSent(false) }} className="btn-primary w-full flex items-center justify-center gap-2">
              <ArrowLeft size={18} /> Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="card p-6 space-y-4">
            <div>
              <label className="text-sm text-wine-600 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <button type="submit" disabled={resetting} className="btn-primary w-full flex items-center justify-center gap-2">
              {resetting ? <div className="w-5 h-5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" /> : 'Send Reset Link'}
            </button>
            <button type="button" onClick={() => setResetMode(false)} className="text-sm text-wine-500 hover:text-blush-500 w-full text-center">
              Back to Login
            </button>
          </form>
        )
      ) : (
        <>
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <label className="text-sm text-wine-600 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="text-sm text-wine-600 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wine-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-400 hover:text-wine-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setResetMode(true)} className="text-sm text-blush-500 hover:text-blush-600">
                Forgot password?
              </button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" /> : <><User size={18} /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-sm text-wine-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blush-500 hover:text-blush-600 font-medium">Sign up</Link>
          </p>
        </>
      )}
    </div>
  )
}
