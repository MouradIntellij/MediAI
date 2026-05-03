const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function api(path, options = {}) {
  const token = localStorage.getItem("mediai_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error?.message || "Erreur API");
  }

  return payload;
}

export const apiUrl = API_URL;
