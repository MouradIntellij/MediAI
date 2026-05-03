import { useEffect, useState } from "react";
import { api } from "./api/client.js";
import { Shell } from "./components/Shell.jsx";
import { Metric } from "./components/Metric.jsx";
import { StatusBadge } from "./components/StatusBadge.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

function useResource(path, fallback) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await api(path);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [path]);

  return { data, loading, error, reload: load };
}

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user) return <LoginPage />;

  return (
    <Shell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "patients" && <Patients />}
      {activeTab === "appointments" && <Appointments />}
      {activeTab === "consultations" && <Consultations />}
      {activeTab === "prescriptions" && <Prescriptions />}
      {activeTab === "analytics" && <Analytics />}
      {activeTab === "security" && <Security />}
    </Shell>
  );
}

function Dashboard() {
  const analytics = useResource("/api/analytics/overview", {});
  const appointments = useResource("/api/appointments", { appointments: [] });

  const upcoming = appointments.data.appointments?.slice(0, 5) || [];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Tableau clinique</h1>
          <p>Vue operationnelle du suivi patient et des priorites de la journee.</p>
        </div>
      </header>

      <div className="metric-grid">
        <Metric label="Patients" value={analytics.data.totalPatients ?? "-"} tone="green" />
        <Metric
          label="Rendez-vous"
          value={sumTotals(analytics.data.appointmentsByStatus)}
          tone="blue"
        />
        <Metric
          label="Prescriptions"
          value={sumTotals(analytics.data.prescriptionsByStatus)}
          tone="orange"
        />
        <Metric label="Risques IA" value={sumTotals(analytics.data.risksByLevel)} tone="red" />
      </div>

      <div className="workspace-grid">
        <section className="panel">
          <h2>Prochains rendez-vous</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medecin</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((item) => (
                  <tr key={item.id}>
                    <td>{item.first_name} {item.last_name}</td>
                    <td>{item.practitioner_name}</td>
                    <td>{formatDate(item.starts_at)}</td>
                    <td><StatusBadge value={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h2>Indicateurs de securite</h2>
          <div className="check-list">
            <span>Authentification JWT</span>
            <span>Controle d'acces par role</span>
            <span>Validation des donnees API</span>
            <span>Journal d'audit</span>
            <span>Rate limiting et headers Helmet</span>
          </div>
        </section>
      </div>
      <InlineError error={analytics.error || appointments.error} />
    </section>
  );
}

function Patients() {
  const { data, error, reload } = useResource("/api/patients", { patients: [] });
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "1985-01-01",
    sex: "female",
    phone: "",
    email: "",
    allergies: "",
    chronicConditions: ""
  });

  async function submit(event) {
    event.preventDefault();
    await api("/api/patients", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        allergies: splitList(form.allergies),
        chronicConditions: splitList(form.chronicConditions),
        emergencyContact: {}
      })
    });
    setForm({ ...form, firstName: "", lastName: "", phone: "", email: "" });
    reload();
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Patients</h1>
          <p>Dossier administratif, allergies, antecedents et contacts.</p>
        </div>
      </header>
      <div className="workspace-grid">
        <section className="panel">
          <h2>Liste des patients</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Naissance</th>
                  <th>Contact</th>
                  <th>Conditions</th>
                </tr>
              </thead>
              <tbody>
                {data.patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.first_name} {patient.last_name}</td>
                    <td>{formatDate(patient.date_of_birth)}</td>
                    <td>{patient.phone || patient.email || "-"}</td>
                    <td>{patient.chronic_conditions?.join(", ") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h2>Nouveau patient</h2>
          <form className="form compact" onSubmit={submit}>
            <div className="form-row">
              <label>Nom<input value={form.lastName} onChange={bind(setForm, "lastName")} required /></label>
              <label>Prenom<input value={form.firstName} onChange={bind(setForm, "firstName")} required /></label>
            </div>
            <div className="form-row">
              <label>Naissance<input type="date" value={form.dateOfBirth} onChange={bind(setForm, "dateOfBirth")} required /></label>
              <label>Sexe<input value={form.sex} onChange={bind(setForm, "sex")} required /></label>
            </div>
            <label>Telephone<input value={form.phone} onChange={bind(setForm, "phone")} /></label>
            <label>Courriel<input value={form.email} onChange={bind(setForm, "email")} /></label>
            <label>Allergies<input value={form.allergies} onChange={bind(setForm, "allergies")} placeholder="penicillin, latex" /></label>
            <label>Conditions chroniques<input value={form.chronicConditions} onChange={bind(setForm, "chronicConditions")} placeholder="diabetes, hypertension" /></label>
            <button className="primary-button" type="submit">Enregistrer</button>
          </form>
        </section>
      </div>
      <InlineError error={error} />
    </section>
  );
}

function Appointments() {
  const appointments = useResource("/api/appointments", { appointments: [] });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Rendez-vous</h1>
          <p>Planification, statut et coordination entre professionnels.</p>
        </div>
      </header>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Praticien</th>
                <th>Debut</th>
                <th>Motif</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {appointments.data.appointments.map((item) => (
                <tr key={item.id}>
                  <td>{item.first_name} {item.last_name}</td>
                  <td>{item.practitioner_name}</td>
                  <td>{formatDate(item.starts_at)}</td>
                  <td>{item.reason}</td>
                  <td><StatusBadge value={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <InlineError error={appointments.error} />
    </section>
  );
}

function Consultations() {
  const consultations = useResource("/api/consultations", { consultations: [] });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Consultations</h1>
          <p>Notes cliniques, constantes vitales, diagnostic et synthese IA.</p>
        </div>
      </header>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Praticien</th>
                <th>Diagnostic</th>
                <th>Resume IA</th>
                <th>Risque</th>
              </tr>
            </thead>
            <tbody>
              {consultations.data.consultations.map((item) => (
                <tr key={item.id}>
                  <td>{item.first_name} {item.last_name}</td>
                  <td>{item.practitioner_name}</td>
                  <td>{item.diagnosis || "-"}</td>
                  <td>{item.ai_summary || "-"}</td>
                  <td><StatusBadge value={item.ai_risk?.level || "low"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <InlineError error={consultations.error} />
    </section>
  );
}

function Prescriptions() {
  const prescriptions = useResource("/api/prescriptions", { prescriptions: [] });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Prescriptions</h1>
          <p>Traitements actifs, posologie et surveillance des interactions.</p>
        </div>
      </header>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Medicament</th>
                <th>Dosage</th>
                <th>Frequence</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.data.prescriptions.map((item) => (
                <tr key={item.id}>
                  <td>{item.first_name} {item.last_name}</td>
                  <td>{item.medication_name}</td>
                  <td>{item.dosage}</td>
                  <td>{item.frequency}</td>
                  <td><StatusBadge value={item.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <InlineError error={prescriptions.error} />
    </section>
  );
}

function Analytics() {
  const analytics = useResource("/api/analytics/overview", {});

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Analyse IA</h1>
          <p>Lecture synthetique des risques cliniques et de l'activite.</p>
        </div>
      </header>
      <div className="workspace-grid">
        <Breakdown title="Rendez-vous" items={analytics.data.appointmentsByStatus} />
        <Breakdown title="Prescriptions" items={analytics.data.prescriptionsByStatus} />
        <Breakdown title="Niveaux de risque" items={analytics.data.risksByLevel} />
        <section className="panel">
          <h2>Role de l'IA</h2>
          <p className="muted">
            Le backend isole les fonctions NLP, score de risque et detection d'interactions dans
            un service dedie. Cette separation permet de remplacer l'heuristique par un modele
            externe sans changer les routes principales.
          </p>
        </section>
      </div>
      <InlineError error={analytics.error} />
    </section>
  );
}

function Security() {
  const audit = useResource("/api/analytics/audit", { auditLogs: [] });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Securite</h1>
          <p>Mesures inspirees HIPAA : moindre privilege, tracabilite et protection API.</p>
        </div>
      </header>
      <section className="panel">
        <h2>Journal d'audit</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Entite</th>
                <th>Utilisateur</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {audit.data.auditLogs.map((item) => (
                <tr key={item.id}>
                  <td>{item.action}</td>
                  <td>{item.entity_type}</td>
                  <td>{item.user_name || "systeme"}</td>
                  <td>{formatDate(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <InlineError error={audit.error} />
    </section>
  );
}

function Breakdown({ title, items = [] }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="breakdown">
        {items.length === 0 ? <span className="muted">Aucune donnee</span> : null}
        {items.map((item) => (
          <div className="breakdown-row" key={item.status || item.level}>
            <span>{item.status || item.level}</span>
            <strong>{item.total}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function InlineError({ error }) {
  return error ? <p className="error">{error}</p> : null;
}

function bind(setForm, key) {
  return (event) => setForm((form) => ({ ...form, [key]: event.target.value }));
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sumTotals(items = []) {
  return items.reduce((sum, item) => sum + Number(item.total || 0), 0);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: value.includes?.("T") ? "short" : undefined
  }).format(new Date(value));
}
