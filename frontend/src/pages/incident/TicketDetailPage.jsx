import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ticketApi, userApi } from '../../api/ticketApi'
import { useAuth } from '../../context/IncidentAuthContext'
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../Components/incident/Badges'
import CommentSection from '../../Components/incident/CommentSection'
import AttachmentPanel from '../../Components/incident/AttachmentPanel'
import StatusTimeline from '../../Components/incident/StatusTimeline'
import toast from 'react-hot-toast'
import './incident.css'

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin, isTechnician } = useAuth()

  const [ticket, setTicket]       = useState(null)
  const [comments, setComments]   = useState([])
  const [history, setHistory]     = useState([])
  const [technicians, setTechs]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [updating, setUpdating]   = useState(false)

  const fetchData = async () => {
    try {
      const [tRes, cRes, hRes] = await Promise.all([
        ticketApi.getById(id),
        ticketApi.getComments(id),
        ticketApi.getHistory(id)
      ])
      setTicket(tRes.data)
      setComments(cRes.data)
      setHistory(hRes.data)
    } catch (e) {
      toast.error('Failed to load ticket details')
      navigate('/tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    if (isAdmin) {
      userApi.getTechnicians().then(r => setTechs(r.data))
    }
  }, [id, isAdmin])

  const handleStatusUpdate = async (newStatus, notes = '') => {
    setUpdating(true)
    try {
      await ticketApi.updateStatus(id, { newStatus, notes, reason: notes })
      toast.success(`Status updated to ${newStatus}`)
      fetchData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const handleAssign = async (techId) => {
    if (!techId) return
    setUpdating(true)
    try {
      await ticketApi.assign(id, techId)
      toast.success('Technician assigned')
      fetchData()
    } catch (e) {
      toast.error('Assignment failed')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ticket? This cannot be undone.')) return
    try {
      await ticketApi.delete(id)
      toast.success('Ticket deleted')
      navigate('/tickets')
    } catch (e) {
      toast.error('Delete failed')
    }
  }

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
  if (!ticket) return null

  const canManage = isAdmin || (isTechnician && ticket.assignedTo?.id === user?.id)

  return (
    <div className="fade-in incident-detail-page">
      {/* Header */}
      <div className="detail-header mb-3">
        <div className="flex items-center gap-1 mb-1">
          <Link to="/tickets" className="btn btn-ghost btn-sm">← Back</Link>
          <span className="text-muted">/</span>
          <span className="text-sm font-bold">TICKET-{ticket.id.slice(-6).toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-start flex-wrap gap-1">
          <h1 className="page-title mb-0">{ticket.title}</h1>
          <div className="flex gap-1">
            {isAdmin && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️ Delete</button>
            )}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Column: Main Info */}
        <div className="detail-main">
          <div className="card mb-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="mb-0">📝 Description</h3>
              <div className="flex gap-1">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <div className="divider" />
            <p className="ticket-description-text">{ticket.description}</p>
            
            <div className="mt-3 grid grid-2 gap-2">
              <div className="info-box">
                <label>📍 Location</label>
                <div>{ticket.location}</div>
              </div>
              <div className="info-box">
                <label>📁 Category</label>
                <div><CategoryBadge category={ticket.category} /></div>
              </div>
            </div>
          </div>

          <AttachmentPanel 
            ticketId={id} 
            attachments={ticket.attachments || []} 
            onRefresh={fetchData} 
          />

          <div className="card mt-2">
            <CommentSection 
              ticketId={id} 
              comments={comments} 
              onRefresh={fetchData} 
            />
          </div>
        </div>

        {/* Right Column: Sidebar Info & Actions */}
        <div className="detail-sidebar">
          {/* Status Controls */}
          {canManage && (
            <div className="card mb-2 highlight-card">
              <h3 className="mb-2">⚙️ Manage Status</h3>
              <div className="divider" />
              <div className="flex flex-col gap-1">
                {ticket.status === 'OPEN' && (
                  <button className="btn btn-primary w-full" onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={updating}>
                    🚀 Start Work
                  </button>
                )}
                {ticket.status === 'IN_PROGRESS' && (
                  <button className="btn btn-success w-full" onClick={() => {
                    const notes = prompt('Please add resolution notes:')
                    if (notes !== null) handleStatusUpdate('RESOLVED', notes)
                  }} disabled={updating}>
                    ✅ Mark Resolved
                  </button>
                )}
                {(ticket.status === 'RESOLVED' || ticket.status === 'REJECTED') && isAdmin && (
                  <button className="btn btn-secondary w-full" onClick={() => handleStatusUpdate('CLOSED')} disabled={updating}>
                    🔒 Close Ticket
                  </button>
                )}
                {ticket.status === 'OPEN' && isAdmin && (
                  <button className="btn btn-danger btn-ghost w-full" onClick={() => {
                    const reason = prompt('Please enter a rejection reason:')
                    if (reason) handleStatusUpdate('REJECTED', reason)
                  }} disabled={updating}>
                    ❌ Reject Ticket
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Assignment */}
          {isAdmin && (
            <div className="card mb-2">
              <h3 className="mb-2">🔧 Assignment</h3>
              <div className="divider" />
              <div className="form-group">
                <label>Assigned Technician</label>
                <select 
                  value={ticket.assignedTo?.id || ''} 
                  onChange={(e) => handleAssign(e.target.value)}
                  disabled={updating}
                  className="w-full"
                >
                  <option value="">Unassigned</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Contact & Meta */}
          <div className="card mb-2">
            <h3 className="mb-2">👤 Reported By</h3>
            <div className="divider" />
            <div className="user-ref-card">
              <div className="user-ref-avatar">{ticket.createdBy?.fullName?.[0]}</div>
              <div className="user-ref-info">
                <div className="user-ref-name">{ticket.createdBy?.fullName}</div>
                <div className="user-ref-email">{ticket.createdBy?.email || 'No email provided'}</div>
              </div>
            </div>
            {(ticket.contactEmail || ticket.contactPhone) && (
              <div className="mt-2 text-sm">
                <label className="text-xs text-muted block mb-05">Direct Contact</label>
                {ticket.contactEmail && <div className="mb-05">📧 {ticket.contactEmail}</div>}
                {ticket.contactPhone && <div>📞 {ticket.contactPhone}</div>}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mb-2">⏳ Timeline</h3>
            <div className="divider" />
            <StatusTimeline history={history} />
          </div>
        </div>
      </div>
    </div>
  )
}
