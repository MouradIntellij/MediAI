import { useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

export function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("doctor@mediai.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="login-title">
          <div className="brand-mark">
            <LockKeyhole size={22} />
          </div>
          <div>
            <h1>MediAI</h1>
            <p>Acces securise au dossier clinique</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Courriel
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="primary-button" disabled={loading} type="submit">
            <LogIn size={18} />
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </section>
    </main>
  );
}
