import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ticketApi } from '../../api/ticketApi'
import { useAuth } from '../../context/IncidentAuthContext'
import toast from 'react-hot-toast'

const CATEGORIES = ['ELECTRICAL','PLUMBING','HVAC','IT_EQUIPMENT','PROJECTOR','NETWORK','FURNITURE','SAFETY','CLEANING','OTHER']
const PRIORITIES  = ['LOW','MEDIUM','HIGH','CRITICAL']

export default function CreateTicketPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    if (user) ticketApi.setIncidentUser(user)
  }, [user])

  const [form, setForm] = useState({
    title:        searchParams.get('title')    || '',
    description:  '',
    category:     '',
    priority:     '',
    location:     searchParams.get('location') || '',
    contactEmail: '',
    contactPhone: '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [files, setFiles]     = useState([])
  const [dragover, setDragover] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.title || form.title.length < 5)    e.title = 'Title must be at least 5 characters'
    if (!form.description || form.description.length < 10) e.description = 'Description must be at least 10 characters'
    if (!form.category)  e.category = 'Category is required'
    if (!form.priority)  e.priority = 'Priority is required'
    if (!form.location)  e.location = 'Location is required'
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      e.contactEmail = 'Valid email required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await ticketApi.create(form)
      const ticketId = res.data.id

      if (files.length > 0) {
        const fd = new FormData()
        files.forEach(f => fd.append('files', f))
        try { await ticketApi.uploadAttachments(ticketId, fd) }
        catch { toast.error('Ticket created but some attachments failed to upload') }
      }

      toast.success('Ticket created successfully!')
      navigate(`/tickets/${ticketId}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket')
    } finally { setLoading(false) }
  }

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const handleFiles = (inputFiles) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp']
    const valid = Array.from(inputFiles).filter(f => {
      if (!allowed.includes(f.type)) { toast.error(`${f.name}: images only`); return false }
      if (f.size > 5 * 1024 * 1024)  { toast.error(`${f.name}: max 5MB`); return false }
      return true
    })
    setFiles(prev => {
      const combined = [...prev, ...valid].slice(0, 3)
      if (prev.length + valid.length > 3) toast.error('Max 3 images allowed')
      return combined
    })
  }

  const priorityColors = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' }

  return (
    <div className="fade-in" style={{ maxWidth: '800px' }}>
      <div className="mb-3">
        <h1 className="page-title">🆕 Report Incident</h1>
        <p className="page-subtitle">Fill in the details below to submit a new maintenance or incident ticket</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="card mb-2">
          <h3 className="mb-2">📋 Basic Information</h3>
          <div className="divider" />

          <div className="form-group">
            <label htmlFor="ticket-title">Title *</label>
            <input id="ticket-title" type="text" placeholder="e.g. Projector not working in Lab 3"
              value={form.title} onChange={e => set('title', e.target.value)}
              className={errors.title ? 'error' : ''} maxLength={200} />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ticket-desc">Description *</label>
            <textarea id="ticket-desc" rows={5}
              placeholder="Describe the issue in detail — what happened, when, and any steps already taken…"
              value={form.description} onChange={e => set('description', e.target.value)}
              className={errors.description ? 'error' : ''} />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select id="category" value={form.category} onChange={e => set('category', e.target.value)}
                className={errors.category ? 'error' : ''}>
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority *</label>
              <select id="priority" value={form.priority} onChange={e => set('priority', e.target.value)}
                className={errors.priority ? 'error' : ''}
                style={{ borderColor: form.priority ? priorityColors[form.priority] : '' }}>
                <option value="">Select priority…</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.priority && <span className="form-error">{errors.priority}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input id="location" type="text" placeholder="e.g. Block A, Room 204"
              value={form.location} onChange={e => set('location', e.target.value)}
              className={errors.location ? 'error' : ''} maxLength={300} />
            {errors.location && <span className="form-error">{errors.location}</span>}
          </div>
        </div>

        <div className="card mb-2">
          <h3 className="mb-2">📞 Contact Details</h3>
          <div className="divider" />
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact-email">Contact Email</label>
              <input id="contact-email" type="email" placeholder="your@email.com"
                value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)}
                className={errors.contactEmail ? 'error' : ''} />
              {errors.contactEmail && <span className="form-error">{errors.contactEmail}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="contact-phone">Contact Phone</label>
              <input id="contact-phone" type="tel" placeholder="+94 77 000 0000"
                value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card mb-2">
          <h3 className="mb-2">📎 Evidence Images <span className="text-muted text-sm">(optional, max 3)</span></h3>
          <div className="divider" />

          <div className={`upload-zone ${dragover ? 'dragover' : ''}`}
            onClick={() => document.getElementById('file-input').click()}
            onDragOver={e => { e.preventDefault(); setDragover(true) }}
            onDragLeave={() => setDragover(false)}
            onDrop={e => { e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files) }}>
            <div className="upload-zone-icon">📤</div>
            <div className="upload-zone-text">
              Drag & drop images here or <strong style={{ color: 'var(--accent)' }}>click to browse</strong>
            </div>
            <div className="text-xs text-muted mt-1">JPEG, PNG, GIF, WebP · Max 5MB each · Up to 3 images</div>
            <input id="file-input" type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="attachments-grid mt-2">
              {files.map((f, i) => (
                <div key={i} className="attachment-thumb" style={{ cursor: 'default' }}>
                  <img src={URL.createObjectURL(f)} alt={f.name} />
                  <div className="attachment-name">{f.name}</div>
                  <button className="attachment-del" style={{ display: 'flex' }}
                    onClick={e => { e.stopPropagation(); setFiles(fs => fs.filter((_, j) => j !== i)) }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button id="submit-ticket-btn" type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" /> Submitting…</> : '🎫 Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}
