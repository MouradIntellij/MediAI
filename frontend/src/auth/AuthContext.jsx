import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

function readSavedUser() {
  try {
    const saved = localStorage.getItem("mediai_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem("mediai_token");
    localStorage.removeItem("mediai_user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("mediai_token");
    if (!token) return;

    api("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("mediai_user", JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem("mediai_token");
        localStorage.removeItem("mediai_user");
        setUser(null);
      });
  }, []);

  async function login(email, password) {
    setLoading(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem("mediai_token", data.token);
      localStorage.setItem("mediai_user", JSON.stringify(data.user));
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("mediai_token");
    localStorage.removeItem("mediai_user");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
