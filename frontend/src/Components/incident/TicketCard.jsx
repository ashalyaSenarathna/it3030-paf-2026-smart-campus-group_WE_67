import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { StatusBadge, PriorityBadge, CategoryBadge } from './Badges'

export default function TicketCard({ ticket }) {
  const ago = ticket.createdAt
    ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
    : ''

  return (
    <Link to={`/tickets/${ticket.id}`} className="ticket-card fade-in">
      <div className="ticket-card-header">
        <div>
          <div className="ticket-card-title">{ticket.title}</div>
          <div className="ticket-info-item mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            📍 {ticket.location}
          </div>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="ticket-card-badges">
        <PriorityBadge priority={ticket.priority} />
        <CategoryBadge category={ticket.category} />
      </div>

      <div className="ticket-card-info">
        <span className="ticket-info-item">👤 {ticket.createdBy?.fullName}</span>
        {ticket.assignedTo && (
          <span className="ticket-info-item">🔧 {ticket.assignedTo.fullName}</span>
        )}
        <span className="ticket-info-item">💬 {ticket.commentCount}</span>
        <span className="ticket-info-item">📎 {ticket.attachments?.length || 0}</span>
        <span className="ticket-info-item" style={{ marginLeft: 'auto' }}>🕒 {ago}</span>
      </div>
    </Link>
  )
}
