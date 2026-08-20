import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Badge from "../ui/Badge";

const NAV_BY_ROLE = {
  admin: [
    { to: "/", label: "Overview", icon: "◆" },
    { to: "/employees", label: "Employees", icon: "☰" },
    { to: "/users", label: "Users & Roles", icon: "☺" },
    { to: "/weekly", label: "Weekly Report", icon: "▤" },
    { to: "/monthly", label: "Monthly Report", icon: "▥" },
    { to: "/balances", label: "Annual Balances", icon: "◷" },
  ],
  manager: [
    { to: "/", label: "Overview", icon: "◆" },
    { to: "/weekly", label: "Weekly Report", icon: "▤" },
    { to: "/monthly", label: "Monthly Report", icon: "▥" },
    { to: "/balances", label: "Annual Balances", icon: "◷" },
  ],
  team_leader: [
    { to: "/", label: "Submit Leave", icon: "✎" },
    { to: "/weekly", label: "Weekly Report", icon: "▤" },
    { to: "/monthly", label: "Monthly Report", icon: "▥" },
  ],
  employee: [
    { to: "/", label: "My Leave", icon: "☺" },
    { to: "/weekly", label: "Weekly Report", icon: "▤" },
  ],
  pending: [],
};

export default function Shell({ children }) {
  const { profile, logout } = useAuth();
  const role = profile?.role || "pending";
  const nav = NAV_BY_ROLE[role] || [];

  return (
    <div className="min-h-screen flex bg-cbe-purple-50">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-cbe-hero text-white">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center p-1.5 shadow-card shrink-0">
            <img src="/cbe-logo.svg" alt="Commercial Bank of Ethiopia" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-display font-semibold leading-tight">Leave Utilization</p>
            <p className="text-[11px] text-white/60 leading-tight">NHQ Building &amp; Property Mgmt</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span className="text-cbe-gold-400">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-xs text-white/50">
          © {new Date().getFullYear()} Commercial Bank of Ethiopia
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-cbe-purple-100 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cbe-purple-900 flex items-center justify-center p-1 shrink-0">
              <img src="/cbe-logo.svg" alt="Commercial Bank of Ethiopia" className="w-full h-full object-contain" />
            </div>
            <p className="font-display font-semibold text-sm">Leave Utilization</p>
          </div>
          <div className="hidden md:block">
            <p className="text-xs text-cbe-slate">Facility Management · NHQ Building Comprehensive Management</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={role}>{role.replace("_", " ")}</Badge>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-tight">{profile?.displayName || profile?.email}</p>
              <p className="text-xs text-cbe-slate leading-tight">{profile?.email}</p>
            </div>
            <button onClick={logout} className="btn-ghost text-xs px-3 py-2">
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1400px] w-full mx-auto">{children}</main>

        <nav className="md:hidden sticky bottom-0 bg-white border-t border-cbe-purple-100 flex justify-around py-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center text-[11px] px-2 py-1 ${isActive ? "text-cbe-purple-800" : "text-cbe-slate"}`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
