import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ticketApi } from '../../api/ticketApi'
import { useAuth } from '../../context/IncidentAuthContext'
import TicketCard from '../../Components/incident/TicketCard'

const STATUSES    = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED','REJECTED']
const PRIORITIES  = ['LOW','MEDIUM','HIGH','CRITICAL']
const CATEGORIES  = ['ELECTRICAL','PLUMBING','HVAC','IT_EQUIPMENT','PROJECTOR','NETWORK','FURNITURE','SAFETY','CLEANING','OTHER']

export default function TicketsPage() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    if (user) ticketApi.setIncidentUser(user)
  }, [user])
  const [tickets, setTickets] = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const [filters, setFilters] = useState({
    status:   searchParams.get('status')   || '',
    priority: searchParams.get('priority') || '',
    category: '',
    keyword:  '',
  })

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, size: 12, sortBy: 'createdAt', direction: 'desc' }
      if (filters.status)   params.status   = filters.status
      if (filters.priority) params.priority = filters.priority
      if (filters.keyword)  params.keyword  = filters.keyword
      const res = await ticketApi.getAll(params)
      setTickets(res.data.content || [])
      setTotal(res.data.totalElements || 0)
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(0) }
  const clearFilters = () => { setFilters({ status: '', priority: '', category: '', keyword: '' }); setPage(0) }

  const totalPages = Math.ceil(total / 12)
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">🎫 All Tickets</h1>
          <p className="page-subtitle">{total} ticket{total !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="filters-bar">
        <input id="search-input" type="search" placeholder="🔍 Search tickets…"
          value={filters.keyword} onChange={e => setFilter('keyword', e.target.value)}
          style={{ minWidth: '220px' }} />
        <select id="filter-status" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <select id="filter-priority" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select id="filter-category" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
        </select>
        {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>}
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No tickets found</div>
          <div className="empty-state-text">Try adjusting your filters or search term</div>
          {hasFilters && <button className="btn btn-secondary mt-2" onClick={clearFilters}>Clear Filters</button>}
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="pagination-btn" onClick={() => setPage(0)} disabled={page === 0}>«</button>
          <button className="pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
            return <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p + 1}</button>
          })}
          <button className="pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>›</button>
          <button className="pagination-btn" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
        </div>
      )}
    </div>
  )
}
