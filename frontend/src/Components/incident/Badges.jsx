export function StatusBadge({ status }) {
  const map = {
    OPEN:        { label: 'Open',        cls: 'badge-open' },
    IN_PROGRESS: { label: 'In Progress', cls: 'badge-in_progress' },
    RESOLVED:    { label: 'Resolved',    cls: 'badge-resolved' },
    CLOSED:      { label: 'Closed',      cls: 'badge-closed' },
    REJECTED:    { label: 'Rejected',    cls: 'badge-rejected' },
  }
  const { label, cls } = map[status] || { label: status, cls: '' }
  return <span className={`badge ${cls}`}><span className="badge-dot" />{label}</span>
}

export function PriorityBadge({ priority }) {
  const icons = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🟠', CRITICAL: '🔴' }
  const cls   = `badge-${priority?.toLowerCase()}`
  return (
    <span className={`badge ${cls}`}>
      {icons[priority]} {priority}
    </span>
  )
}

export function CategoryBadge({ category }) {
  const icons = {
    ELECTRICAL:'⚡', PLUMBING:'🔧', HVAC:'❄️', IT_EQUIPMENT:'💻',
    PROJECTOR:'📽️', NETWORK:'🌐', FURNITURE:'🪑', SAFETY:'🦺',
    CLEANING:'🧹', OTHER:'📋',
  }
  return (
    <span className="badge" style={{ background:'rgba(99,102,241,0.12)', color:'#a5b4fc' }}>
      {icons[category] || '📋'} {category?.replace('_', ' ')}
    </span>
  )
}
