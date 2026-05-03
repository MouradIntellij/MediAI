import {
  Activity,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Stethoscope,
  Users
} from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

const tabs = [
  { id: "dashboard", label: "Tableau", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "appointments", label: "Rendez-vous", icon: CalendarDays },
  { id: "consultations", label: "Consultations", icon: Stethoscope },
  { id: "prescriptions", label: "Prescriptions", icon: ClipboardList },
  { id: "analytics", label: "Analyse IA", icon: Activity },
  { id: "security", label: "Securite", icon: ShieldCheck }
];

export function Shell({ activeTab, onTabChange, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <FileText size={22} />
          </div>
          <div>
            <strong>MediAI</strong>
            <span>Gestion clinique</span>
          </div>
        </div>

        <nav className="nav-list">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "nav-item active" : "nav-item"}
                onClick={() => onTabChange(tab.id)}
                title={tab.label}
                type="button"
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="user-panel">
          <div>
            <strong>{user?.fullName}</strong>
            <span>{user?.role}</span>
          </div>
          <button className="icon-button" onClick={logout} title="Deconnexion" type="button">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
