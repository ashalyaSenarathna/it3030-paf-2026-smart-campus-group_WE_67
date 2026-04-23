import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { useAuth } from '../../context/IncidentAuthContext'
import { ticketApi } from '../../api/ticketApi'
import toast from 'react-hot-toast'

export default function CommentSection({ ticketId, comments, onRefresh }) {
  const { user, isAdmin } = useAuth()
  const [content, setContent]   = useState('')
  const [posting, setPosting]   = useState(false)
  const [editId, setEditId]     = useState(null)
  const [editContent, setEditContent] = useState('')

  const handlePost = async () => {
    if (!content.trim()) return
    setPosting(true)
    try {
      await ticketApi.addComment(ticketId, { content })
      setContent('')
      onRefresh()
      toast.success('Comment posted')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to post comment')
    } finally { setPosting(false) }
  }

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return
    try {
      await ticketApi.editComment(ticketId, commentId, { content: editContent })
      setEditId(null)
      onRefresh()
      toast.success('Comment updated')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update comment')
    }
  }

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await ticketApi.deleteComment(ticketId, commentId)
      onRefresh()
      toast.success('Comment deleted')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete comment')
    }
  }

  const canModify = (comment) => comment.author?.id === user?.id || isAdmin

  return (
    <div>
      <div className="detail-section-title">💬 Comments ({comments.length})</div>

      <div className="comment-list">
        {comments.length === 0 && (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-text">No comments yet. Be the first to comment.</div>
          </div>
        )}

        {comments.map(c => (
          <div key={c.id} className="comment-item slide-in">
            <div className="comment-header">
              <div>
                <span className="comment-author">{c.author?.fullName}</span>
                <span className="comment-role">({c.author?.role})</span>
                {c.edited && <span className="comment-edited"> · edited</span>}
              </div>
              <span className="comment-date" title={c.createdAt ? format(new Date(c.createdAt), 'PPpp') : ''}>
                {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
              </span>
            </div>

            {editId === c.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(c.id)}>Save</button>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: '0.35rem', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                {c.content}
              </p>
            )}

            {canModify(c) && editId !== c.id && (
              <div className="comment-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(c.id); setEditContent(c.content) }}>
                  ✏️ Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="comment-compose">
        <textarea
          id="comment-input"
          placeholder="Write a comment…"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handlePost() }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-xs text-muted">Ctrl+Enter to post</span>
          <button className="btn btn-primary btn-sm" onClick={handlePost} disabled={posting || !content.trim()}>
            {posting ? <><span className="spinner" /> Posting…</> : '📝 Post Comment'}
          </button>
        </div>
      </div>
    </div>
  )
}
