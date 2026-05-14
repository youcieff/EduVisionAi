const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.') ||
  window.location.port === '3000'
);

// We rely completely on the Next.js rewrite proxy now
export const BASE_URL = ''; 
export const API_URL = '/api';

export const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // For local development running directly on port 5000 from mobile, etc.
  if (!isBrowser || window.location.hostname === 'localhost') {
     return `http://localhost:5000${cleanPath}`;
  }
  
  // When running through a tunnel, use the tunnel's /uploads/ rewrite route
  return cleanPath;
};

const apiConfig = {
  BASE_URL,
  API_URL,
  getAssetUrl,
  isLocalhost
};
export default apiConfig;
