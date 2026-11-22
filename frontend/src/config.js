// HireLens AI API Base Configuration
const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
export const API_BASE = import.meta.env.VITE_API_URL || (hostname === '127.0.0.1' ? 'http://127.0.0.1:8000' : `http://${hostname}:8000`);
