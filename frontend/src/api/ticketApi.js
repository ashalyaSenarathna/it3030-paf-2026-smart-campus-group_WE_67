/**
 * Ticket API — calls /api/tickets/* on the main backend (port 8085).
 * Uses session cookies (credentials: 'include') and sends the current user
 * via X-User-* headers so the backend can track ownership without a separate
 * auth system.
 */

const BASE = '/api/tickets'

// User headers are set per-call from the incident auth context value
let _user = null
export function setIncidentUser(u) { _user = u }

function userHeaders() {
  if (!_user) return {}
  return {
    'X-User-Id':    _user.id    || '',
    'X-User-Name':  _user.fullName || '',
    'X-User-Email': _user.email || '',
    'X-User-Role':  _user.role  || 'USER',
  }
}

async function req(url, options = {}) {
  const fullUrl = `${BASE}${url}`
  const res = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...userHeaders(),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e = new Error(err.message || `Request failed ${res.status}`)
    e.response = { data: err, status: res.status }
    throw e
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return { data: null }
  const text = await res.text()
  return { data: text ? JSON.parse(text) : null }
}

async function upload(url, formData) {
  const fullUrl = `${BASE}${url}`
  const res = await fetch(fullUrl, {
    method: 'POST',
    credentials: 'include',
    headers: { ...userHeaders() }, // NO Content-Type — let browser set multipart boundary
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e = new Error(err.message || `Upload failed ${res.status}`)
    e.response = { data: err, status: res.status }
    throw e
  }
  const text = await res.text()
  return { data: text ? JSON.parse(text) : null }
}

export const ticketApi = {
  setIncidentUser,
  // Tickets
  getAll:      (params) => req(`?${new URLSearchParams(params)}`),
  getMy:       (params) => req(`/my?${new URLSearchParams(params)}`),
  getAssigned: (params) => req(`/assigned?${new URLSearchParams(params)}`),
  getById:     (id)     => req(`/${id}`),
  create:      (data)   => req('', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus:(id, data) => req(`/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  assign:      (id, technicianId) => req(`/${id}/assign?technicianId=${technicianId}`, { method: 'PUT' }),
  reject:      (id, data)  => req(`/${id}/reject`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete:      (id)         => req(`/${id}`, { method: 'DELETE' }),
  getHistory:  (id)         => req(`/${id}/history`),
  getDashboard: ()          => req('/dashboard'),

  // Comments
  getComments:   (ticketId)            => req(`/${ticketId}/comments`),
  addComment:    (ticketId, data)      => req(`/${ticketId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  editComment:   (ticketId, cid, data) => req(`/${ticketId}/comments/${cid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteComment: (ticketId, cid)       => req(`/${ticketId}/comments/${cid}`, { method: 'DELETE' }),

  // Attachments
  getAttachments:    (ticketId)             => req(`/${ticketId}/attachments`),
  uploadAttachments: (ticketId, formData)   => upload(`/${ticketId}/attachments`, formData),
  deleteAttachment:  (ticketId, aid)        => req(`/${ticketId}/attachments/${aid}`, { method: 'DELETE' }),
  downloadUrl:       (ticketId, aid)        => `/api/tickets/${ticketId}/attachments/${aid}/download`,
}

export const userApi = {
  getTechnicians: () => req('/users/technicians'),
}
