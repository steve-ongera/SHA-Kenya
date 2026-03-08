// ============================================
// SHA Kenya - API Service Layer
// All API calls go through this module
// ============================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Token Management ────────────────────────
export const getToken = () => localStorage.getItem('sha_token');
export const getRefreshToken = () => localStorage.getItem('sha_refresh_token');
export const setTokens = (access, refresh) => {
  localStorage.setItem('sha_token', access);
  if (refresh) localStorage.setItem('sha_refresh_token', refresh);
};
export const clearTokens = () => {
  localStorage.removeItem('sha_token');
  localStorage.removeItem('sha_refresh_token');
  localStorage.removeItem('sha_user');
};

// ─── Core Request Handler ────────────────────
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = { ...options, headers };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        headers.Authorization = `Bearer ${getToken()}`;
        const retryResponse = await fetch(`${BASE_URL}${endpoint}`, { ...config, headers });
        if (!retryResponse.ok) throw await retryResponse.json();
        return retryResponse.status === 204 ? null : retryResponse.json();
      } else {
        clearTokens();
        window.location.href = '/login';
        return;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw error;
    }

    return response.status === 204 ? null : response.json();
  } catch (err) {
    throw err;
  }
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL.replace('/api', '')}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (res.ok) {
      const data = await res.json();
      setTokens(data.access, null);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Auth ─────────────────────────────────────
export const authAPI = {
  login: (username, password) =>
    fetch(`${BASE_URL.replace('/api', '')}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(async (res) => {
      if (!res.ok) throw await res.json();
      return res.json();
    }),
  me: () => request('/me/'),
};

// ─── Dashboard ────────────────────────────────
export const dashboardAPI = {
  getStats: () => request('/dashboard/'),
};

// ─── Counties ─────────────────────────────────
export const countiesAPI = {
  list: (params = {}) => request(`/counties/?${new URLSearchParams(params)}`),
  get: (id) => request(`/counties/${id}/`),
  create: (data) => request('/counties/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/counties/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/counties/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/counties/${id}/`, { method: 'DELETE' }),
};

// ─── Health Facilities ─────────────────────────
export const facilitiesAPI = {
  list: (params = {}) => request(`/facilities/?${new URLSearchParams(params)}`),
  get: (id) => request(`/facilities/${id}/`),
  create: (data) => request('/facilities/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/facilities/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/facilities/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/facilities/${id}/`, { method: 'DELETE' }),
};

// ─── Members ──────────────────────────────────
export const membersAPI = {
  list: (params = {}) => request(`/members/?${new URLSearchParams(params)}`),
  get: (id) => request(`/members/${id}/`),
  create: (data) => request('/members/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/members/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/members/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/members/${id}/`, { method: 'DELETE' }),
};

// ─── Claims ───────────────────────────────────
export const claimsAPI = {
  list: (params = {}) => request(`/claims/?${new URLSearchParams(params)}`),
  get: (id) => request(`/claims/${id}/`),
  create: (data) => request('/claims/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/claims/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/claims/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/claims/${id}/`, { method: 'DELETE' }),
};

// ─── Contributions ────────────────────────────
export const contributionsAPI = {
  list: (params = {}) => request(`/contributions/?${new URLSearchParams(params)}`),
  get: (id) => request(`/contributions/${id}/`),
  create: (data) => request('/contributions/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/contributions/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  patch: (id, data) => request(`/contributions/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/contributions/${id}/`, { method: 'DELETE' }),
};

// ─── Utils ────────────────────────────────────
export const formatCurrency = (amount) =>
  `KES ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default {
  authAPI, dashboardAPI, countiesAPI, facilitiesAPI, membersAPI, claimsAPI, contributionsAPI,
  formatCurrency, formatDate, formatDateTime,
};