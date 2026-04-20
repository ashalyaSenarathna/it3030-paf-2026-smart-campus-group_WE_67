const BASE_URL = '';

const fetchWithCredentials = (url, options = {}) => {
  return fetch(`${BASE_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
};

export const login = async (username, password) => {
  const response = await fetchWithCredentials('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Invalid username or password');
  }
  return response.json();
};

export const getCurrentUser = async () => {
  const response = await fetchWithCredentials('/api/auth/me');
  if (!response.ok) {
    throw new Error('Unauthenticated');
  }
  return response.json();
};

export const getProfile = async () => {
  const response = await fetchWithCredentials('/api/profile');
  if (!response.ok) {
    throw new Error('Unable to load profile');
  }
  return response.json();
};

export const updatePassword = async (currentPassword, newPassword) => {
  const response = await fetchWithCredentials('/api/profile/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return response.json();
};

export const logout = async () => {
  const response = await fetchWithCredentials('/api/auth/logout', {
    method: 'POST',
  });
  return response.ok;
};
