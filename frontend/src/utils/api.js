/**
 * api.js — Central API configuration for Smart Resq frontend.
 *
 * ALL components must import from here instead of using
 * import.meta.env.VITE_API_BASE directly.
 *
 * This ensures a single source of truth and guarantees
 * Railway backend URL is used across Vercel deployment.
 */

export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE ||   // fallback: same as API
  'http://localhost:5000';

/**
 * apiFetch — thin wrapper around fetch that always targets Railway.
 * Automatically injects Authorization header if token exists.
 *
 * Usage:
 *   const data = await apiFetch('/api/auth/login', { method: 'POST', body: ... });
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  return res;
}
