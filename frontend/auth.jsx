// ─────────────────────────────────────────────────────────────────────
// Keycloak OIDC Auth — login redirect, token via backend proxy
// ─────────────────────────────────────────────────────────────────────

// Config fetched from backend /api/v1/auth/config or injected by nginx
const AUTH_CONFIG = {
  keycloakUrl: window.__AGENTHUB_KEYCLOAK_URL || '',
  realm: window.__AGENTHUB_KEYCLOAK_REALM || '',
  clientId: window.__AGENTHUB_KEYCLOAK_CLIENT_ID || '',
  devMode: true, // updated by init()
  get redirectUri() { return window.location.origin + window.location.pathname; },
};

const auth = {
  // Initialize: fetch config from backend
  async init() {
    try {
      const res = await fetch('/api/v1/auth/config');
      if (res.ok) {
        const cfg = await res.json();
        AUTH_CONFIG.keycloakUrl = cfg.server_url || AUTH_CONFIG.keycloakUrl;
        AUTH_CONFIG.realm = cfg.realm || AUTH_CONFIG.realm;
        AUTH_CONFIG.clientId = cfg.client_id || AUTH_CONFIG.clientId;
        AUTH_CONFIG.devMode = cfg.dev_mode;
      }
    } catch {}
  },

  getToken() {
    return sessionStorage.getItem('agenthub_token');
  },

  isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Redirect to Keycloak login page
  login() {
    const { keycloakUrl, realm, clientId, redirectUri } = AUTH_CONFIG;
    if (!keycloakUrl || AUTH_CONFIG.devMode) return;
    const authUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
    });
    window.location.href = `${authUrl}?${params}`;
  },

  // Exchange code via backend proxy (backend holds client_secret)
  async exchangeCode(code) {
    const res = await fetch('/api/v1/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirect_uri: AUTH_CONFIG.redirectUri,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Token exchange failed:', err);
      throw new Error('Token exchange failed');
    }
    const data = await res.json();
    sessionStorage.setItem('agenthub_token', data.access_token);
    if (data.refresh_token) sessionStorage.setItem('agenthub_refresh', data.refresh_token);
    return data.access_token;
  },

  logout() {
    sessionStorage.removeItem('agenthub_token');
    sessionStorage.removeItem('agenthub_refresh');
    sessionStorage.clear();
    // Clear any auth cookies
    document.cookie.split(';').forEach(c => {
      document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });
    const { keycloakUrl, realm, redirectUri } = AUTH_CONFIG;
    if (keycloakUrl && !AUTH_CONFIG.devMode) {
      const logoutUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout`;
      window.location.href = `${logoutUrl}?post_logout_redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${AUTH_CONFIG.clientId}`;
    } else {
      window.location.reload();
    }
  },

  // Handle ?code= callback from Keycloak
  async handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      try {
        await this.exchangeCode(code);
      } catch (e) {
        console.error('Auth callback failed:', e);
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      return true;
    }
    return false;
  },
};

// Patch fetch to include Bearer token on /api/ requests
const _origFetch = window.fetch;
window.fetch = function(url, opts = {}) {
  const token = auth.getToken();
  if (token && typeof url === 'string' && url.includes('/api/')) {
    opts.headers = opts.headers || {};
    if (opts.headers instanceof Headers) {
      if (!opts.headers.has('Authorization')) opts.headers.set('Authorization', `Bearer ${token}`);
    } else {
      if (!opts.headers['Authorization']) opts.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return _origFetch.call(this, url, opts);
};

Object.assign(window, { auth, AUTH_CONFIG });
