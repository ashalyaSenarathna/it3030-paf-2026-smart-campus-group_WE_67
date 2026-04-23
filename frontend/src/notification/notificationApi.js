const BASE_URL = '/api/notifications';

const fetchWithCredentials = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
};

export const notificationApi = {
  getAll: (userId) => fetchWithCredentials(`${BASE_URL}/${userId}`),
  getUnreadCount: (userId) => fetchWithCredentials(`${BASE_URL}/${userId}/unread-count`),
  markAsRead: (id) => fetchWithCredentials(`${BASE_URL}/${id}/read`, { method: 'PUT' }),
  markAllAsRead: (userId) => fetchWithCredentials(`${BASE_URL}/${userId}/read-all`, { method: 'PUT' }),
  delete: (id) => fetchWithCredentials(`${BASE_URL}/${id}`, { method: 'DELETE' }),
};
