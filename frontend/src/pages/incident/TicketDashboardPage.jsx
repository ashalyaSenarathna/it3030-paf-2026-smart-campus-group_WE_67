import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ticketApi } from '../../api/ticketApi'
import { useAuth } from '../../context/IncidentAuthContext'
import TicketCard from '../../Components/incident/TicketCard'

const STAT_CONFIGS = [
  { key: 'totalTickets',     label: 'Total Tickets',  icon: '🎫', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { key: 'openTickets',      label: 'Open',           icon: '📋', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'inProgressTickets',label: 'In Progress',    icon: '⚙️', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'resolvedTickets',  label: 'Resolved',       icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'closedTickets',    label: 'Closed',         icon: '🔒', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  { key: 'rejectedTickets',  label: 'Rejected',       icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { key: 'myTickets',        label: 'My Tickets',     icon: '👤', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'myOpenTickets',    label: 'My Open',        icon: '🔔', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
]

export default function DashboardPage() {
  const { user, isAdmin, isTechnician } = useAuth()
  const [stats, setStats]               = useState(null)
  const [recent, setRecent]             = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingTickets, setLoadingTickets] = useState(true)

  useEffect(() => {
    ticketApi.getDashboard()
      .then(r => setStats(r.data))
      .finally(() => setLoadingStats(false))

    const params = { page: 0, size: 6, sortBy: 'createdAt', direction: 'desc' }
    const apiCall = isTechnician ? ticketApi.getAssigned(params) : ticketApi.getMy(params)
    apiCall.then(r => setRecent(r.data.content || [])).finally(() => setLoadingTickets(false))
  }, [isTechnician])

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">👋 Welcome, {user?.fullName?.split(' ')[0]}</h1>
          <p className="page-subtitle">Here's your campus incident overview</p>
        </div>
        <Link to="/incidents/create" className="btn btn-primary">➕ New Ticket</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {STAT_CONFIGS.map(cfg => (
          <div key={cfg.key} className="stat-card" style={{ '--stat-color': cfg.color, '--stat-color-bg': cfg.bg }}>
            <div className="stat-icon">{cfg.icon}</div>
            <div className="stat-value" style={{ color: cfg.color }}>
              {loadingStats ? <span className="spinner" /> : (stats?.[cfg.key] ?? 0)}
            </div>
            <div className="stat-label">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <h3>{isTechnician ? '🔧 My Assigned Tickets' : '🎫 My Recent Tickets'}</h3>
          <Link to="/tickets" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        <div className="divider" />

        {loadingTickets ? (
          <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎫</div>
            <div className="empty-state-title">No tickets yet</div>
            <div className="empty-state-text">Create your first incident ticket to get started.</div>
            <Link to="/incidents/create" className="btn btn-primary mt-2">Create Ticket</Link>
          </div>
        ) : (
          <div className="tickets-grid">
            {recent.map(t => <TicketCard key={t.id} ticket={t} />)}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card mt-2">
        <h3 className="mb-2">⚡ Quick Actions</h3>
        <div className="divider" />
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/incidents/create" className="btn btn-primary">➕ Report Incident</Link>
          <Link to="/tickets?status=OPEN" className="btn btn-secondary">📋 View Open Tickets</Link>
          <Link to="/tickets?status=IN_PROGRESS" className="btn btn-secondary">⚙️ In Progress</Link>
          {(isAdmin || isTechnician) && (
            <Link to="/tickets" className="btn btn-secondary">🔧 Manage Tickets</Link>
          )}
          {isAdmin && (
            <Link to="/tickets?priority=CRITICAL" className="btn btn-danger">🔴 Critical Issues</Link>
          )}
        </div>
      </div>
    </div>
  )
}
