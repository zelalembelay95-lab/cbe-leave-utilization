export default function EmptyState({ title, body, action }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-14">
      <div className="w-12 h-12 rounded-full bg-cbe-purple-100 flex items-center justify-center text-cbe-purple-700 text-xl mb-3">
        ✦
      </div>
      <h3 className="font-display text-lg font-semibold text-cbe-ink">{title}</h3>
      {body && <p className="text-sm text-cbe-slate mt-1 max-w-sm">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
