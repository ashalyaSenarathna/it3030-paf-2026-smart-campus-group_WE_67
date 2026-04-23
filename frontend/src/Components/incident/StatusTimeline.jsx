import { format } from 'date-fns'
import { StatusBadge } from './Badges'

const STATUS_ICONS = {
  OPEN: '📋', IN_PROGRESS: '⚙️', RESOLVED: '✅', CLOSED: '🔒', REJECTED: '❌',
}

export default function StatusTimeline({ history }) {
  if (!history?.length) return null

  return (
    <div className="timeline">
      {history.map((h) => (
        <div key={h.id} className="timeline-item">
          <div className="timeline-line" />
          <div className="timeline-dot" style={{ background: 'var(--bg-secondary)' }}>
            {STATUS_ICONS[h.toStatus] || '🔄'}
          </div>
          <div className="timeline-content">
            <div className="timeline-title flex items-center gap-1">
              <StatusBadge status={h.toStatus} />
              {h.fromStatus && <span className="text-xs text-muted">from {h.fromStatus.replace('_', ' ')}</span>}
            </div>
            <div className="timeline-sub">
              by <strong>{h.changedBy || 'System'}</strong>
              {h.changedAt && ` · ${format(new Date(h.changedAt), 'dd MMM yyyy, HH:mm')}`}
            </div>
            {h.reason && (
              <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)',
                background: 'var(--bg-input)', padding: '0.375rem 0.625rem',
                borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--accent)' }}>
                {h.reason}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
