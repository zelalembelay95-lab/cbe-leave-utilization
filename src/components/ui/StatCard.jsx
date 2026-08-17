export default function StatCard({ label, value, sub, tone = "purple", icon }) {
  const tones = {
    purple: "bg-cbe-purple-900 text-white",
    gold: "bg-cbe-gold-500 text-cbe-purple-950",
    white: "bg-white text-cbe-ink border border-cbe-purple-100",
  };
  return (
    <div className={`rounded-2xl p-5 shadow-card ${tones[tone]}`}>
      <div className="flex items-start justify-between">
        <p className={`text-xs font-semibold uppercase tracking-wide ${tone === "white" ? "text-cbe-slate" : "opacity-80"}`}>
          {label}
        </p>
        {icon && <span className="text-lg opacity-80">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {sub && <p className={`mt-1 text-xs ${tone === "white" ? "text-cbe-slate" : "opacity-75"}`}>{sub}</p>}
    </div>
  );
}
