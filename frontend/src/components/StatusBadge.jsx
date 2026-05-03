const labels = {
  scheduled: "Planifie",
  confirmed: "Confirme",
  completed: "Termine",
  cancelled: "Annule",
  active: "Actif",
  paused: "Pause",
  high: "Eleve",
  medium: "Moyen",
  low: "Faible"
};

export function StatusBadge({ value }) {
  return <span className={`badge badge-${value}`}>{labels[value] || value}</span>;
}
