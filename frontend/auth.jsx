// ─────────────────────────────────────────────────────────────────────
// Keycloak OIDC Auth — login redirect, token management
// ─────────────────────────────────────────────────────────────────────

const AUTH_CONFIG = {
  // These are injected by the backend configmap in production.
  // For local dev (DEV_MODE=true), auth is skipped entirely.
  get keycloakUrl() { return window.__AGENTHUB_KEYCLOAK_URL || ''; },
  get realm() { return window.__AGENTHUB_KEYCLOAK_REALM || ''; },
  get clientId() { return window.__AGENTHUB_KEYCLOAK_CLIENT_ID || ''; },
  get redirectUri() { return window.location.origin + window.location.pathname; },
};

const auth = {
  // Get stored token
  getToken() {
    return sessionStorage.getItem('agenthub_token');
  },

  // Check if logged in
  isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;
    // Check expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Redirect to Keycloak login
  login() {
    const { keycloakUrl, realm, clientId, redirectUri } = AUTH_CONFIG;
    if (!keycloakUrl) return; // DEV_MODE, no keycloak
    const authUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
    });
    window.location.href = `${authUrl}?${params}`;
  },

  // Exchange auth code for token
  async exchangeCode(code) {
    const { keycloakUrl, realm, clientId, redirectUri } = AUTH_CONFIG;
    const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      }),
    });
    if (!res.ok) throw new Error('Token exchange failed');
    const data = await res.json();
    sessionStorage.setItem('agenthub_token', data.access_token);
    if (data.refresh_token) sessionStorage.setItem('agenthub_refresh', data.refresh_token);
    return data.access_token;
  },

  // Logout
  logout() {
    sessionStorage.removeItem('agenthub_token');
    sessionStorage.removeItem('agenthub_refresh');
    const { keycloakUrl, realm, redirectUri } = AUTH_CONFIG;
    if (keycloakUrl) {
      window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(redirectUri)}`;
    } else {
      window.location.reload();
    }
  },

  // Handle redirect callback (check for ?code= in URL)
  async handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      await this.exchangeCode(code);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      return true;
    }
    return false;
  },
};

// Patch the API helper to include Bearer token in requests
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
