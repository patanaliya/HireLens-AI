// HireLens AI API Base Configuration
// Automatically adapts to localhost, local Wi-Fi IP, or production cloud backend URL
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : `http://${window.location.hostname}:8000`)
