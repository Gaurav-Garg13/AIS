export const VITE_API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "");

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("auth_token");
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${VITE_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};
