// HireLens AI API Base Configuration
// Automatically adapts to localhost, local Wi-Fi IP, or production cloud backend URL
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'https://hirelens-backend-ea18.onrender.com'
    : `http://${window.location.hostname}:8000`)
