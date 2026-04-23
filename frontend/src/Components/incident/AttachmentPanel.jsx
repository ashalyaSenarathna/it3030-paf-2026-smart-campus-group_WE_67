import { useState, useRef } from 'react'
import { ticketApi } from '../../api/ticketApi'
import toast from 'react-hot-toast'

const MAX_FILES = 3
const ALLOWED   = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export default function AttachmentPanel({ ticketId, attachments, onRefresh, canDelete }) {
  const [uploading, setUploading] = useState(false)
  const [dragover, setDragover]   = useState(false)
  const fileRef = useRef()

  const handleFiles = async (files) => {
    const valid = Array.from(files).filter(f => {
      if (!ALLOWED.includes(f.type)) { toast.error(`${f.name}: only images allowed`); return false }
      if (f.size > 5 * 1024 * 1024)  { toast.error(`${f.name}: max 5MB`); return false }
      return true
    })
    if (!valid.length) return
    if (attachments.length + valid.length > MAX_FILES) {
      toast.error(`Max ${MAX_FILES} attachments per ticket (${attachments.length} existing)`)
      return
    }
    const formData = new FormData()
    valid.forEach(f => formData.append('files', f))
    setUploading(true)
    try {
      await ticketApi.uploadAttachments(ticketId, formData)
      onRefresh()
      toast.success(`${valid.length} image(s) uploaded`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed')
    } finally { setUploading(false) }
  }

  const handleDelete = async (attachmentId) => {
    if (!confirm('Delete this attachment?')) return
    try {
      await ticketApi.deleteAttachment(ticketId, attachmentId)
      onRefresh()
      toast.success('Attachment deleted')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  const openImage = (tid, id) => window.open(ticketApi.downloadUrl(tid, id), '_blank')

  return (
    <div>
      <div className="detail-section-title">📎 Attachments ({attachments.length}/{MAX_FILES})</div>

      <div className="attachments-grid">
        {attachments.map(a => (
          <div key={a.id} className="attachment-thumb" onClick={() => openImage(ticketId, a.id)}>
            <img
              src={ticketApi.downloadUrl(ticketId, a.id)}
              alt={a.originalFileName}
              onError={e => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='110' height='110'%3E%3Crect width='110' height='110' fill='%231a2235'/%3E%3Ctext x='55' y='60' text-anchor='middle' fill='%23475569' font-size='28'%3E🖼️%3C/text%3E%3C/svg%3E" }}
            />
            <div className="attachment-name">{a.originalFileName}</div>
            {canDelete && (
              <button className="attachment-del" onClick={e => { e.stopPropagation(); handleDelete(a.id) }}>✕</button>
            )}
          </div>
        ))}

        {attachments.length < MAX_FILES && (
          <div
            className={`upload-zone ${dragover ? 'dragover' : ''}`}
            style={{ width: '110px', height: '110px', padding: '0.5rem' }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragover(true) }}
            onDragLeave={() => setDragover(false)}
            onDrop={e => { e.preventDefault(); setDragover(false); handleFiles(e.dataTransfer.files) }}
          >
            {uploading
              ? <div className="spinner" />
              : <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem' }}>📤</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Upload</div>
                </div>
            }
            <input type="file" ref={fileRef} accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)} />
          </div>
        )}
      </div>

      {attachments.length === 0 && !uploading && (
        <div className="empty-state" style={{ padding: '1.5rem' }}>
          <div className="empty-state-text">No images attached. Click the upload area above.</div>
        </div>
      )}
    </div>
  )
}
