const BASE_URL = '/api';

const fetchWithCredentials = async (url, options = {}) => {
  const fullUrl = `${BASE_URL}${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  
  const data = await response.json();
  // Wrap in .data to maintain compatibility with existing components
  return { data };
};

export const resourceApi = {
  getAll: () => fetchWithCredentials('/resources'),
  getById: (id) => fetchWithCredentials(`/resources/${id}`),
  create: (data) => fetchWithCredentials('/resources', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => fetchWithCredentials(`/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => fetchWithCredentials(`/resources/${id}`, {
    method: 'DELETE',
  }),
};

export const bookingApi = {
  getAll: () => fetchWithCredentials('/bookings'),
  create: (data) => fetchWithCredentials('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  approve: (id) => fetchWithCredentials(`/bookings/${id}/approve`, {
    method: 'PUT',
  }),
  reject: (id, reason) => fetchWithCredentials(`/bookings/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  }),
  cancel: (id) => fetchWithCredentials(`/bookings/${id}/cancel`, {
    method: 'PUT',
  }),
  getByUser: (userId) => fetchWithCredentials(`/bookings/user/${userId}`),
  update: (id, data) => fetchWithCredentials(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  checkAvailability: (resourceId, date) => fetchWithCredentials(`/bookings/availability?resourceId=${resourceId}&date=${date}`),
};

export const adminApi = {
  getUsers: () => fetchWithCredentials('/admin/users'),
};

const api = {
  get: (url) => fetchWithCredentials(url),
  post: (url, data) => fetchWithCredentials(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => fetchWithCredentials(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => fetchWithCredentials(url, { method: 'DELETE' }),
};

export default api;
