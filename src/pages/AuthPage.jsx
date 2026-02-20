// src/pages/AuthPage.jsx
// Used for both /login and /signup

import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"

export default function AuthPage({ onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isSignup = location.pathname === "/signup"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")

    // Basic validation
    if (isSignup && name.trim().length < 2) {
      setError("Please enter your full name.")
      return
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    // Fake auth — just save user to localStorage and redirect
    setTimeout(() => {
      const user = { name: name || email.split("@")[0], email }
      localStorage.setItem("civicUser", JSON.stringify(user))
      onLogin(user)
      navigate("/dashboard")
      setLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Back to landing */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <span className="text-orange-500 text-2xl">⬡</span>
            <span className="text-xl font-bold text-white">Civic Mirror</span>
          </div>

          <h1 className="text-2xl font-black text-white mb-1">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {isSignup
              ? "Join thousands of citizens making their city better."
              : "Sign in to track complaints and hold departments accountable."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="Anmol Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 px-4 py-2.5 pr-11 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-lg transition-all mt-2"
            >
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <Link
              to={isSignup ? "/login" : "/signup"}
              className="text-orange-400 hover:text-orange-300 font-semibold"
            >
              {isSignup ? "Log In" : "Sign Up Free"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}