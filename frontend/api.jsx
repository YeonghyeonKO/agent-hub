// ─────────────────────────────────────────────────────────────────────
// API helper — frontend ↔ backend bridge
// ─────────────────────────────────────────────────────────────────────

const API_BASE = (window.location.port === '3000') ? 'http://localhost:8000/api/v1' : '/api/v1';

const api = {
  async get(path) {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path}: ${res.status}`);
    return res.json();
  },

  async postForm(path, formData) {
    const res = await fetch(API_BASE + path, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`POST ${path}: ${res.status}`);
    return res.json();
  },

  async patchForm(path, formData) {
    const res = await fetch(API_BASE + path, { method: 'PATCH', body: formData });
    if (!res.ok) throw new Error(`PATCH ${path}: ${res.status}`);
    return res.json();
  },

  async put(path, body) {
    const res = await fetch(API_BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path}: ${res.status}`);
    return res.json();
  },

  async del(path) {
    const res = await fetch(API_BASE + path, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error(`DELETE ${path}: ${res.status}`);
    return res.status === 204 ? null : res.json();
  },

  async patch(path, body) {
    const res = await fetch(API_BASE + path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${path}: ${res.status}`);
    return res.json();
  },

  // Convenience
  components: {
    list: (params = {}) => {
      const filtered = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null));
      const q = new URLSearchParams(filtered).toString();
      return api.get('/components' + (q ? '?' + q : ''));
    },
    get: (id) => api.get(`/components/${id}`),
    create: (formData) => api.postForm('/components', formData),
    star: (id) => api.post(`/components/${id}/star`),
    download: (id) => api.post(`/components/${id}/download`),
    file: (id) => api.get(`/components/${id}/file`),
    update: (id, formData) => api.patchForm(`/components/${id}`, formData),
    versions: (id) => api.get(`/components/${id}/versions`),
  },
  rankings: {
    list: (params = {}) => {
      const filtered = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null));
      const q = new URLSearchParams(filtered).toString();
      return api.get('/rankings' + (q ? '?' + q : ''));
    },
  },
  notices: {
    list: (params = {}) => {
      const filtered = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null));
      const q = new URLSearchParams(filtered).toString();
      return api.get('/notices' + (q ? '?' + q : ''));
    },
    get: (id) => api.get(`/notices/${id}`),
    create: (body) => api.post('/notices', body),
    update: (id, body) => api.put(`/notices/${id}`, body),
    del: (id) => api.del(`/notices/${id}`),
  },
  voc: {
    list: (params = {}) => {
      const filtered = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null));
      const q = new URLSearchParams(filtered).toString();
      return api.get('/voc' + (q ? '?' + q : ''));
    },
    get: (id) => api.get(`/voc/${id}`),
    create: (body) => api.post('/voc', body),
    comment: (id, body) => api.post(`/voc/${id}/comments`, body),
    upvote: (id) => api.post(`/voc/${id}/upvote`),
    status: (id, status) => api.patch(`/voc/${id}/status`, { status }),
  },
  users: {
    me: () => api.get('/users/me'),
    myComponents: () => api.get('/users/me/components'),
  },
  admin: {
    pending: () => api.get('/admin/pending'),
    approved: () => api.get('/admin/approved'),
    rejected: () => api.get('/admin/rejected'),
    issues: () => api.get('/admin/issues'),
    review: (id, body) => api.post(`/admin/review/${id}`, body),
    settings: () => api.get('/admin/settings'),
    updateSettings: (body) => api.put('/admin/settings', body),
    users: () => api.get('/admin/users'),
    updateRole: (empId, role) => api.patch(`/admin/users/${empId}/role`, { role }),
    deleted: () => api.get('/admin/deleted'),
    deleteComponent: (id) => api.del(`/admin/components/${id}`),
    statistics: () => api.get('/admin/statistics'),
  },
};

// Hook: useFetch — simple data fetching with loading/error
function useFetch(fetchFn, deps = []) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const reload = React.useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFn()
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { console.error(e); setError(e); setLoading(false); });
  }, deps);

  React.useEffect(reload, [reload]);

  return { data, loading, error, reload, setData };
}

// Format ISO datetime to YYYY-MM-DD
function fmtDate(d) {
  if (!d) return '';
  return d.length > 10 ? d.slice(0, 10) : d;
}

Object.assign(window, { api, useFetch, fmtDate });
