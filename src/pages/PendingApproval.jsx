import { useAuth } from "../context/AuthContext";

export default function PendingApproval() {
  const { profile, logout } = useAuth();
  return (
    <div className="min-h-screen bg-cbe-hero flex items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-4">
          ⏳
        </div>
        <h1 className="font-display text-xl font-semibold text-cbe-ink">Awaiting approval</h1>
        <p className="text-sm text-cbe-slate mt-2">
          Hi {profile?.displayName || profile?.email}, your account has been created but an administrator still
          needs to assign your role (Employee, Team Leader, or Manager) before you can access the dashboard.
        </p>
        <button onClick={logout} className="btn-ghost mt-6">
          Sign out
        </button>
      </div>
    </div>
  );
}
