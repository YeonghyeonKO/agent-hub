// ─────────────────────────────────────────────────────────────────────
// API helper — frontend ↔ backend bridge
// ─────────────────────────────────────────────────────────────────────

const API_BASE = (window.location.port === '3000') ? 'http://localhost:8000/api/v1' : '/api/v1';

function handleResponse(res, method, path) {
  if (res.status === 403) {
    if (method === 'POST' || method === 'PUT') {
      alert('권한이 없습니다. 관리자에게 권한을 요청하세요.');
    }
    throw new Error(`${method} ${path}: 403 Forbidden`);
  }
  if (!res.ok) {
    // 백엔드의 detail 메시지를 호출 측에서 읽을 수 있도록 응답/상태를 에러에 첨부한다.
    const err = new Error(`${method} ${path}: ${res.status}`);
    err.status = res.status;
    err.response = res;
    throw err;
  }
  return res;
}

const api = {
  async get(path, params) {
    let url = API_BASE + path;
    if (params) {
      const filtered = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null));
      const q = new URLSearchParams(filtered).toString();
      if (q) url += (path.includes('?') ? '&' : '?') + q;
    }
    const res = await fetch(url);
    handleResponse(res, 'GET', path);
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    handleResponse(res, 'POST', path);
    return res.json();
  },

  async postForm(path, formData) {
    const res = await fetch(API_BASE + path, { method: 'POST', body: formData });
    handleResponse(res, 'POST', path);
    return res.json();
  },

  async patchForm(path, formData) {
    const res = await fetch(API_BASE + path, { method: 'PATCH', body: formData });
    handleResponse(res, 'PATCH', path);
    return res.json();
  },

  async put(path, body) {
    const res = await fetch(API_BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    handleResponse(res, 'PUT', path);
    return res.json();
  },

  async del(path) {
    const res = await fetch(API_BASE + path, { method: 'DELETE' });
    if (res.status === 403) throw new Error(`DELETE ${path}: 403 Forbidden`);
    if (!res.ok && res.status !== 204) throw new Error(`DELETE ${path}: ${res.status}`);
    return res.status === 204 ? null : res.json();
  },

  async patch(path, body) {
    const res = await fetch(API_BASE + path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    handleResponse(res, 'PATCH', path);
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
    versionFile: (id, versionId) => api.get(`/components/${id}/versions/${versionId}/file`),
    improvements: (id) => api.get(`/components/${id}/improvements`),
    improvement: (id, impId) => api.get(`/components/${id}/improvements/${impId}`),
    submitImprovement: (id, formData) => api.postForm(`/components/${id}/improvements`, formData),
    reviewImprovement: (id, impId, body) => api.post(`/components/${id}/improvements/${impId}/review`, body),
    withdrawImprovement: (id, impId) => api.del(`/components/${id}/improvements/${impId}`),
    contributors: (id) => api.get(`/components/${id}/contributors`),
  },
  deploy: {
    endpoints: () => api.get('/deploy/endpoints'),
    addEndpoint: (body) => api.post('/deploy/endpoints', body),
    delEndpoint: (id) => api.del(`/deploy/endpoints/${id}`),
    test: (body) => api.post('/deploy/test', body),
    testEndpoint: (id) => api.post(`/deploy/endpoints/${id}/test`),
    projects: (id) => api.get(`/deploy/endpoints/${id}/projects`),
    flows: (id, projectId) => api.get(`/deploy/endpoints/${id}/projects/${projectId}/flows`),
    deployAsset: (componentId, body) => api.post(`/deploy/components/${componentId}`, body),
    suggestedUrl: () => api.get('/deploy/suggested-url'),
  },
  notifications: {
    list: (unreadOnly = false) => api.get('/notifications' + (unreadOnly ? '?unread_only=true' : '')),
    unreadCount: () => api.get('/notifications/unread-count'),
    read: (id) => api.post(`/notifications/${id}/read`),
    readAll: () => api.post('/notifications/read-all'),
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
    update: (id, body) => api.put(`/voc/${id}`, body),
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
    bulkReview: (body) => api.post('/admin/review/bulk', body),
    settings: () => api.get('/admin/settings'),
    updateSettings: (body) => api.put('/admin/settings', body),
    users: (params) => api.get('/admin/users', params),
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
