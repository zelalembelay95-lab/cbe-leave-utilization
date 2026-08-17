const TONES = {
  admin: "bg-cbe-purple-800 text-white",
  manager: "bg-cbe-gold-500 text-cbe-purple-950",
  team_leader: "bg-cbe-purple-100 text-cbe-purple-800",
  employee: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  expired: "bg-red-100 text-red-700",
  default: "bg-cbe-purple-100 text-cbe-purple-800",
};

const LABELS = {
  admin: "Admin",
  manager: "Manager",
  team_leader: "Team Leader",
  employee: "Employee",
  pending: "Pending",
};

export default function Badge({ tone = "default", children }) {
  return <span className={`badge ${TONES[tone] || TONES.default}`}>{children ?? LABELS[tone] ?? tone}</span>;
}
