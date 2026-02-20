// src/App.jsx — final version with all features

import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import Report from "./pages/Report"
import MapView from "./pages/MapView"
import Scorecard from "./pages/Scorecard"
import Landing from "./pages/Landing"
import AuthPage from "./pages/AuthPage"
import AdminPanel from "./pages/AdminPanel"
import SocialFeed from "./pages/SocialFeed"
import { mockComplaints } from "./data/mockComplaints"

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/" replace />
  return children
}

function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden min-w-0">{children}</main>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="flex justify-between mb-3"><div className="h-4 bg-slate-200 rounded w-2/3"></div><div className="h-5 w-14 bg-slate-200 rounded-full"></div></div>
      <div className="space-y-2 mb-4"><div className="h-3 bg-slate-200 rounded w-full"></div><div className="h-3 bg-slate-200 rounded w-4/5"></div></div>
      <div className="flex gap-3 mb-3"><div className="h-3 bg-slate-200 rounded w-20"></div><div className="h-3 bg-slate-200 rounded w-24"></div></div>
      <div className="flex justify-between pt-3 border-t border-slate-100"><div className="h-6 w-16 bg-slate-200 rounded-md"></div><div className="h-6 w-12 bg-slate-200 rounded-lg"></div></div>
    </div>
  )
}

export function SkeletonGrid() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}

function ProfilePage({ user, onLogout, complaints }) {
  const mine = complaints.filter(c => c.submittedBy === user?.email)
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Profile</h1>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div><p className="text-lg font-bold text-slate-900">{user?.name}</p><p className="text-slate-500 text-sm">{user?.email}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 rounded-xl p-4"><p className="text-2xl font-black text-orange-500">{mine.length}</p><p className="text-xs text-slate-500 mt-1">Complaints Filed</p></div>
            <div className="bg-slate-50 rounded-xl p-4"><p className="text-2xl font-black text-green-500">{mine.filter(c => c.status === "resolved").length}</p><p className="text-xs text-slate-500 mt-1">Resolved</p></div>
          </div>
        </div>
        <button onClick={onLogout} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl border border-red-200 transition-colors">Log Out</button>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("civicUser")) } catch { return null } })
  const [complaints, setComplaints] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      try { const s = localStorage.getItem("complaints"); setComplaints(s ? JSON.parse(s) : mockComplaints) }
      catch { setComplaints(mockComplaints) }
      setLoading(false)
    }, 800)
  }, [])

  useEffect(() => { if (complaints) localStorage.setItem("complaints", JSON.stringify(complaints)) }, [complaints])

  const addComplaint = (c) => setComplaints(prev => [c, ...(prev || [])])
  const handleLogin = (u) => setUser(u)
  const handleLogout = () => { localStorage.removeItem("civicUser"); setUser(null) }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage onLogin={handleLogin} />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage onLogin={handleLogin} />} />

      <Route path="/admin" element={<ProtectedRoute user={user}><AdminPanel complaints={complaints || []} setComplaints={setComplaints} /></ProtectedRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute user={user}><AppShell>{loading ? <SkeletonGrid /> : <Dashboard complaints={complaints} setComplaints={setComplaints} user={user} />}</AppShell></ProtectedRoute>} />
      <Route path="/social" element={<ProtectedRoute user={user}><AppShell><SocialFeed addComplaint={addComplaint} /></AppShell></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute user={user}><AppShell><Report addComplaint={addComplaint} user={user} /></AppShell></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute user={user}><AppShell><MapView complaints={complaints || []} /></AppShell></ProtectedRoute>} />
      <Route path="/scorecards" element={<ProtectedRoute user={user}><AppShell><Scorecard /></AppShell></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute user={user}><AppShell><ProfilePage user={user} onLogout={handleLogout} complaints={complaints || []} /></AppShell></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App