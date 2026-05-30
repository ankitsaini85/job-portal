// Central API base URL helper
// Uses Vite env variable VITE_API_BASE or VITE_API_URL when available.
export const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function buildUrl(path = '') {
  if (!path) return API_BASE;
  return path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
}

export default API_BASE;
