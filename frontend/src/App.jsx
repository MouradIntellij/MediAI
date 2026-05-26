import { useEffect, useState } from "react";
import { api } from "./api/client.js";
import { Shell } from "./components/Shell.jsx";
import { Metric } from "./components/Metric.jsx";
import { StatusBadge } from "./components/StatusBadge.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

const diseaseCatalog = {
  Hypertension: [
    { name: "Lisinopril", dosage: "10 mg", frequency: "1 fois par jour" },
    { name: "Amlodipine", dosage: "5 mg", frequency: "1 fois par jour" },
    { name: "Hydrochlorothiazide", dosage: "12.5 mg", frequency: "1 fois par jour" }
  ],
  Diabete: [
    { name: "Metformin", dosage: "500 mg", frequency: "2 fois par jour" },
    { name: "Gliclazide", dosage: "30 mg", frequency: "1 fois par jour" },
    { name: "Insuline glargine", dosage: "10 unites", frequency: "au coucher" }
  ],
  Asthme: [
    { name: "Salbutamol", dosage: "100 mcg", frequency: "au besoin" },
    { name: "Budesonide", dosage: "200 mcg", frequency: "2 fois par jour" },
    { name: "Montelukast", dosage: "10 mg", frequency: "1 fois par jour" }
  ],
  Infection: [
    { name: "Amoxicilline", dosage: "500 mg", frequency: "3 fois par jour" },
    { name: "Azithromycine", dosage: "500 mg", frequency: "1 fois par jour" },
    { name: "Cephalexine", dosage: "500 mg", frequency: "4 fois par jour" }
  ],
  Douleur: [
    { name: "Acetaminophene", dosage: "500 mg", frequency: "aux 6 heures au besoin" },
    { name: "Ibuprofene", dosage: "400 mg", frequency: "aux 8 heures au besoin" },
    { name: "Naproxene", dosage: "250 mg", frequency: "2 fois par jour" }
  ]
};

function useResource(path, fallback, enabled = true) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!enabled || !path) return;
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
    if (!enabled || !path) {
      setData(fallback);
      return;
    }
    load();
  }, [path, enabled]);

  return { data, loading, error, reload: load };
}

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (user?.role === "nurse" && ["prescriptions", "consultations", "analytics", "security", "admin"].includes(activeTab)) {
      setActiveTab("schedule");
    }
    if (user?.role === "doctor" && ["schedule", "security", "admin"].includes(activeTab)) {
      setActiveTab("dashboard");
    }
    if (user?.role !== "admin" && activeTab === "admin") {
      setActiveTab("dashboard");
    }
  }, [activeTab, user?.role]);

  if (!user) return <LoginPage />;

  return (
    <Shell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && <Dashboard user={user} onTabChange={setActiveTab} />}
      {activeTab === "schedule" && <NurseSchedule />}
      {activeTab === "patients" && <Patients />}
      {activeTab === "appointments" && <Appointments />}
      {activeTab === "consultations" && <DoctorWorkspace user={user} mode="consultations" />}
      {activeTab === "prescriptions" && <DoctorWorkspace user={user} mode="prescriptions" />}
      {activeTab === "analytics" && <Analytics />}
      {activeTab === "security" && <Security />}
      {activeTab === "admin" && <AdminConsole />}
    </Shell>
  );
}

function Dashboard({ user, onTabChange }) {
  const analytics = useResource("/api/analytics/overview", {});
  const appointments = useResource("/api/appointments", { appointments: [] });
  const today = new Date().toDateString();
  const upcoming = appointments.data.appointments?.filter((item) => new Date(item.starts_at) >= new Date()).slice(0, 5) || [];
  const todaysAppointments = appointments.data.appointments?.filter((item) => new Date(item.starts_at).toDateString() === today) || [];

  const roleCards = {
    nurse: [
      ["Calendrier interactif", "Voir les disponibilites medecin et fixer un rendez-vous.", "schedule"],
      ["Annulations", "Traiter les annulations patient ou medecin.", "schedule"],
      ["Patients", "Mettre a jour les coordonnees et alertes administratives.", "patients"]
    ],
    doctor: [
      ["Dossier malade", "Lire l'historique, consultations et traitements actifs.", "consultations"],
      ["Prescription guidee", "Choisir un medicament selon la maladie et detecter les interactions.", "prescriptions"],
      ["Analyse IA", "Suivre les risques et signaux cliniques.", "analytics"]
    ],
    admin: [
      ["Utilisateurs", "Creer les comptes et controler les roles.", "admin"],
      ["Audit", "Surveiller les actions sensibles.", "security"],
      ["Pilotage", "Suivre activite, risques et volumes.", "analytics"]
    ]
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>{dashboardTitle(user.role)}</h1>
          <p>{dashboardSubtitle(user.role)}</p>
        </div>
      </header>

      <div className="metric-grid">
        <Metric label="Patients" value={analytics.data.totalPatients ?? "-"} tone="green" />
        <Metric label="Rendez-vous jour" value={todaysAppointments.length} tone="blue" />
        <Metric label="Rendez-vous total" value={sumTotals(analytics.data.appointmentsByStatus)} tone="orange" />
        <Metric label="Risques IA" value={sumTotals(analytics.data.risksByLevel)} tone="red" />
      </div>

      <div className="quick-actions">
        {(roleCards[user.role] || []).map(([title, text, tab]) => (
          <button key={title} className="action-card" type="button" onClick={() => onTabChange(tab)}>
            <strong>{title}</strong>
            <span>{text}</span>
          </button>
        ))}
      </div>

      <div className="workspace-grid">
        <section className="panel">
          <h2>Prochains rendez-vous</h2>
          <AppointmentsTable appointments={upcoming} compact />
        </section>
        <section className="panel">
          <h2>Priorites du role</h2>
          <div className="check-list">
            {rolePriorities(user.role).map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>
      </div>
      <InlineError error={analytics.error || appointments.error} />
    </section>
  );
}

function NurseSchedule() {
  const patients = useResource("/api/patients", { patients: [] });
  const practitioners = useResource("/api/users/practitioners", { practitioners: [] });
  const appointments = useResource("/api/appointments", { appointments: [] });
  const doctors = practitioners.data.practitioners.filter((person) => person.role === "doctor");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [reason, setReason] = useState("Consultation de suivi");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!selectedDoctorId && doctors[0]) setSelectedDoctorId(doctors[0].id);
  }, [doctors, selectedDoctorId]);

  useEffect(() => {
    if (!selectedPatientId && patients.data.patients[0]) setSelectedPatientId(patients.data.patients[0].id);
  }, [patients.data.patients, selectedPatientId]);

  const doctorAppointments = appointments.data.appointments.filter(
    (item) => item.practitioner_id === selectedDoctorId && item.starts_at?.startsWith(selectedDate)
  );
  const slots = buildSlots(selectedDate, doctorAppointments);

  async function book(slot) {
    setNotice("");
    const startsAt = new Date(slot.value);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    await api("/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        patientId: selectedPatientId,
        practitionerId: selectedDoctorId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: "confirmed",
        reason,
        location: "Clinique principale"
      })
    });
    setNotice("Rendez-vous confirme.");
    appointments.reload();
  }

  async function updateStatus(id, status) {
    await api(`/api/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    appointments.reload();
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Calendrier infirmiere</h1>
          <p>Disponibilites du medecin, prise de rendez-vous et gestion des annulations.</p>
        </div>
      </header>

      <div className="toolbar">
        <label>Medecin
          <select value={selectedDoctorId} onChange={bindValue(setSelectedDoctorId)}>
            {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>)}
          </select>
        </label>
        <label>Date
          <input type="date" value={selectedDate} onChange={bindValue(setSelectedDate)} />
        </label>
        <label>Patient
          <select value={selectedPatientId} onChange={bindValue(setSelectedPatientId)}>
            {patients.data.patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>
            ))}
          </select>
        </label>
        <label>Motif
          <input value={reason} onChange={bindValue(setReason)} />
        </label>
      </div>

      <div className="schedule-grid">
        <section className="panel">
          <h2>Creneaux disponibles</h2>
          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                key={slot.value}
                className={slot.available ? "slot available" : "slot busy"}
                disabled={!slot.available || !selectedPatientId || !selectedDoctorId}
                onClick={() => book(slot)}
                type="button"
              >
                <strong>{slot.label}</strong>
                <span>{slot.available ? "Disponible" : "Occupe"}</span>
              </button>
            ))}
          </div>
          {notice ? <p className="success">{notice}</p> : null}
        </section>

        <section className="panel">
          <h2>Rendez-vous du medecin</h2>
          <div className="appointment-list">
            {doctorAppointments.length === 0 ? <p className="muted">Aucun rendez-vous pour cette date.</p> : null}
            {doctorAppointments.map((item) => (
              <div className="appointment-card" key={item.id}>
                <div>
                  <strong>{formatTime(item.starts_at)} - {item.first_name} {item.last_name}</strong>
                  <span>{item.reason}</span>
                </div>
                <StatusBadge value={item.status} />
                <div className="button-row">
                  <button type="button" onClick={() => updateStatus(item.id, "confirmed")}>Confirmer</button>
                  <button type="button" onClick={() => updateStatus(item.id, "cancelled")}>Annuler</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <InlineError error={patients.error || practitioners.error || appointments.error} />
    </section>
  );
}

function DoctorWorkspace({ user, mode }) {
  const patients = useResource("/api/patients", { patients: [] });
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const selectedPatient = patients.data.patients.find((patient) => patient.id === selectedPatientId);

  useEffect(() => {
    if (!selectedPatientId && patients.data.patients[0]) setSelectedPatientId(patients.data.patients[0].id);
  }, [patients.data.patients, selectedPatientId]);

  const consultations = useResource(
    selectedPatientId ? `/api/consultations?patientId=${selectedPatientId}` : "",
    { consultations: [] },
    Boolean(selectedPatientId)
  );
  const prescriptions = useResource(
    selectedPatientId ? `/api/prescriptions?patientId=${selectedPatientId}` : "",
    { prescriptions: [] },
    Boolean(selectedPatientId)
  );
  const appointments = useResource("/api/appointments", { appointments: [] });
  const patientAppointments = appointments.data.appointments.filter((item) => item.patient_id === selectedPatientId);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>{mode === "prescriptions" ? "Prescription guidee" : "Dossier clinique medecin"}</h1>
          <p>Historique du malade, traitements actifs, consultations et aide a la decision.</p>
        </div>
      </header>

      <div className="patient-selector">
        <label>Patient
          <select value={selectedPatientId} onChange={bindValue(setSelectedPatientId)}>
            {patients.data.patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.first_name} {patient.last_name}</option>
            ))}
          </select>
        </label>
        {selectedPatient ? (
          <div className="patient-summary">
            <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong>
            <span>Ne le {formatDate(selectedPatient.date_of_birth)} | {selectedPatient.chronic_conditions?.join(", ") || "Aucune condition chronique"}</span>
            <span>Allergies: {selectedPatient.allergies?.join(", ") || "aucune"}</span>
          </div>
        ) : null}
      </div>

      <div className="doctor-grid">
        <section className="panel">
          <h2>Historique du malade</h2>
          <Timeline
            consultations={consultations.data.consultations}
            prescriptions={prescriptions.data.prescriptions}
            appointments={patientAppointments}
          />
        </section>
        <section className="panel">
          {mode === "prescriptions" ? (
            <PrescriptionAssistant
              patientId={selectedPatientId}
              practitionerId={user.id}
              onCreated={prescriptions.reload}
            />
          ) : (
            <ConsultationForm
              patientId={selectedPatientId}
              practitionerId={user.id}
              appointments={patientAppointments}
              onCreated={consultations.reload}
            />
          )}
        </section>
      </div>
      <InlineError error={patients.error || consultations.error || prescriptions.error || appointments.error} />
    </section>
  );
}

function PrescriptionAssistant({ patientId, practitionerId, onCreated }) {
  const [disease, setDisease] = useState("Hypertension");
  const [medIndex, setMedIndex] = useState(0);
  const [instructions, setInstructions] = useState("Surveiller l'efficacite et les effets indesirables.");
  const [result, setResult] = useState("");
  const medication = diseaseCatalog[disease][medIndex] || diseaseCatalog[disease][0];

  useEffect(() => setMedIndex(0), [disease]);

  async function submit(event) {
    event.preventDefault();
    setResult("");
    const response = await api("/api/prescriptions", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        practitionerId,
        medicationName: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        startDate: todayISO(),
        endDate: null,
        instructions: `${instructions} Indication: ${disease}.`
      })
    });
    const interactionText = response.interactions?.length
      ? `Interactions detectees: ${response.interactions.join(", ")}`
      : "Aucune interaction critique detectee.";
    setResult(`Prescription creee. ${interactionText}`);
    onCreated();
  }

  return (
    <>
      <h2>Choix par maladie</h2>
      <form className="form compact" onSubmit={submit}>
        <label>Type de maladie
          <select value={disease} onChange={bindValue(setDisease)}>
            {Object.keys(diseaseCatalog).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>Medicament recommande
          <select value={medIndex} onChange={(event) => setMedIndex(Number(event.target.value))}>
            {diseaseCatalog[disease].map((item, index) => (
              <option key={item.name} value={index}>{item.name} - {item.dosage}</option>
            ))}
          </select>
        </label>
        <div className="clinical-card">
          <strong>{medication.name}</strong>
          <span>{medication.dosage} | {medication.frequency}</span>
        </div>
        <label>Instructions
          <textarea value={instructions} onChange={bindValue(setInstructions)} rows={4} />
        </label>
        <button className="primary-button" type="submit" disabled={!patientId}>Prescrire</button>
      </form>
      {result ? <p className="success">{result}</p> : null}
    </>
  );
}

function ConsultationForm({ patientId, practitionerId, appointments, onCreated }) {
  const [diagnosis, setDiagnosis] = useState("Suivi clinique");
  const [notes, setNotes] = useState("Patient stable. Evaluation clinique complete et recommandations expliquees.");
  const [bloodPressure, setBloodPressure] = useState("128/82");
  const [heartRate, setHeartRate] = useState("76");
  const [appointmentId, setAppointmentId] = useState("");
  const [result, setResult] = useState("");

  async function submit(event) {
    event.preventDefault();
    setResult("");
    const response = await api("/api/consultations", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        practitionerId,
        appointmentId: appointmentId || null,
        diagnosis,
        notes,
        vitals: { bloodPressure, heartRate }
      })
    });
    setResult(`Consultation creee. Risque IA: ${response.ai?.risk?.level || "non evalue"}.`);
    onCreated();
  }

  return (
    <>
      <h2>Nouvelle consultation</h2>
      <form className="form compact" onSubmit={submit}>
        <label>Rendez-vous lie
          <select value={appointmentId} onChange={bindValue(setAppointmentId)}>
            <option value="">Aucun</option>
            {appointments.map((item) => (
              <option key={item.id} value={item.id}>{formatDate(item.starts_at)} - {item.reason}</option>
            ))}
          </select>
        </label>
        <label>Diagnostic
          <input value={diagnosis} onChange={bindValue(setDiagnosis)} />
        </label>
        <div className="form-row">
          <label>Tension
            <input value={bloodPressure} onChange={bindValue(setBloodPressure)} />
          </label>
          <label>Frequence cardiaque
            <input value={heartRate} onChange={bindValue(setHeartRate)} />
          </label>
        </div>
        <label>Notes cliniques
          <textarea value={notes} onChange={bindValue(setNotes)} rows={5} />
        </label>
        <button className="primary-button" type="submit" disabled={!patientId}>Enregistrer</button>
      </form>
      {result ? <p className="success">{result}</p> : null}
    </>
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
          <PatientsTable patients={data.patients} />
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
        <AppointmentsTable appointments={appointments.data.appointments} />
      </section>
      <InlineError error={appointments.error} />
    </section>
  );
}

function AdminConsole() {
  const users = useResource("/api/users", { users: [] });
  const analytics = useResource("/api/analytics/overview", {});
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "Password123!",
    role: "doctor"
  });
  const [notice, setNotice] = useState("");

  async function submit(event) {
    event.preventDefault();
    setNotice("");
    await api("/api/users", {
      method: "POST",
      body: JSON.stringify(form)
    });
    setNotice("Utilisateur cree.");
    setForm({ fullName: "", email: "", password: "Password123!", role: "doctor" });
    users.reload();
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Administration</h1>
          <p>Role admin: gouvernance des comptes, droits d'acces, audit et pilotage clinique.</p>
        </div>
      </header>

      <div className="metric-grid">
        <Metric label="Utilisateurs" value={users.data.users.length} tone="green" />
        <Metric label="Patients" value={analytics.data.totalPatients ?? "-"} tone="blue" />
        <Metric label="Rendez-vous" value={sumTotals(analytics.data.appointmentsByStatus)} tone="orange" />
        <Metric label="Prescriptions" value={sumTotals(analytics.data.prescriptionsByStatus)} tone="red" />
      </div>

      <div className="workspace-grid">
        <section className="panel">
          <h2>Comptes et roles</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Courriel</th>
                  <th>Role</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {users.data.users.map((item) => (
                  <tr key={item.id}>
                    <td>{item.full_name}</td>
                    <td>{item.email}</td>
                    <td>{item.role}</td>
                    <td>{item.active ? "Actif" : "Inactif"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h2>Creer un utilisateur</h2>
          <form className="form compact" onSubmit={submit}>
            <label>Nom complet<input value={form.fullName} onChange={bind(setForm, "fullName")} required /></label>
            <label>Courriel<input type="email" value={form.email} onChange={bind(setForm, "email")} required /></label>
            <label>Role
              <select value={form.role} onChange={bind(setForm, "role")}>
                <option value="admin">Admin</option>
                <option value="doctor">Medecin</option>
                <option value="nurse">Infirmiere</option>
                <option value="patient">Patient</option>
              </select>
            </label>
            <label>Mot de passe<input value={form.password} onChange={bind(setForm, "password")} minLength={8} required /></label>
            <button className="primary-button" type="submit">Creer le compte</button>
          </form>
          {notice ? <p className="success">{notice}</p> : null}
        </section>
      </div>
      <InlineError error={users.error || analytics.error} />
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
          <h2>Aide clinique</h2>
          <p className="muted">
            Les signaux IA restent des indicateurs d'aide a la decision. Le medecin garde la
            validation clinique finale, notamment pour prescriptions et interactions.
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
          <h1>Audit</h1>
          <p>Tracabilite des actions sensibles et controle operationnel.</p>
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

function PatientsTable({ patients }) {
  return (
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
          {patients.map((patient) => (
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
  );
}

function AppointmentsTable({ appointments, compact = false }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Praticien</th>
            <th>Debut</th>
            {!compact ? <th>Motif</th> : null}
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((item) => (
            <tr key={item.id}>
              <td>{item.first_name} {item.last_name}</td>
              <td>{item.practitioner_name}</td>
              <td>{formatDate(item.starts_at)}</td>
              {!compact ? <td>{item.reason}</td> : null}
              <td><StatusBadge value={item.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Timeline({ consultations, prescriptions, appointments }) {
  const events = [
    ...consultations.map((item) => ({
      id: `c-${item.id}`,
      date: item.created_at,
      title: item.diagnosis || "Consultation",
      text: item.ai_summary || item.notes,
      type: "Consultation"
    })),
    ...prescriptions.map((item) => ({
      id: `p-${item.id}`,
      date: item.created_at,
      title: item.medication_name,
      text: `${item.dosage} - ${item.frequency}`,
      type: "Prescription"
    })),
    ...appointments.map((item) => ({
      id: `a-${item.id}`,
      date: item.starts_at,
      title: item.reason,
      text: item.status,
      type: "Rendez-vous"
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (events.length === 0) return <p className="muted">Aucun historique pour ce patient.</p>;

  return (
    <div className="timeline">
      {events.map((event) => (
        <article className="timeline-item" key={event.id}>
          <span>{event.type} | {formatDate(event.date)}</span>
          <strong>{event.title}</strong>
          <p>{event.text}</p>
        </article>
      ))}
    </div>
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

function buildSlots(date, appointments) {
  const busyStarts = new Set(
    appointments
      .filter((item) => item.status !== "cancelled")
      .map((item) => formatInputDateTime(item.starts_at))
  );

  return Array.from({ length: 18 }, (_, index) => {
    const hour = 8 + Math.floor(index / 2);
    const minute = index % 2 === 0 ? "00" : "30";
    const value = `${date}T${String(hour).padStart(2, "0")}:${minute}`;
    return {
      value,
      label: `${String(hour).padStart(2, "0")}:${minute}`,
      available: !busyStarts.has(value)
    };
  });
}

function dashboardTitle(role) {
  if (role === "nurse") return "Poste infirmiere";
  if (role === "doctor") return "Espace medecin";
  if (role === "admin") return "Console administrateur";
  return "Tableau clinique";
}

function dashboardSubtitle(role) {
  if (role === "nurse") return "Planifier les rendez-vous et coordonner le flux patient.";
  if (role === "doctor") return "Diagnostiquer, consulter l'historique et prescrire.";
  if (role === "admin") return "Piloter les utilisateurs, la securite et l'activite.";
  return "Vue operationnelle du suivi patient.";
}

function rolePriorities(role) {
  if (role === "nurse") {
    return [
      "Fixer les rendez-vous selon les disponibilites du medecin",
      "Confirmer ou annuler les rendez-vous",
      "Maintenir les donnees administratives patient"
    ];
  }
  if (role === "doctor") {
    return [
      "Consulter l'historique complet du malade",
      "Documenter la consultation et le diagnostic",
      "Prescrire avec surveillance des interactions"
    ];
  }
  return [
    "Gerer les comptes et les roles",
    "Surveiller l'audit et la conformite",
    "Suivre les indicateurs d'activite"
  ];
}

function InlineError({ error }) {
  return error ? <p className="error">{error}</p> : null;
}

function bind(setForm, key) {
  return (event) => setForm((form) => ({ ...form, [key]: event.target.value }));
}

function bindValue(setter) {
  return (event) => setter(event.target.value);
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatInputDateTime(value) {
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: value.includes?.("T") ? "short" : undefined
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-CA", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
