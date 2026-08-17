import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register, firebaseConfigured } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-cbe-hero flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-cbe-gold-500 flex items-center justify-center text-cbe-purple-950 font-display font-bold text-xl shadow-card">
            CBE
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-white">Leave Utilization</h1>
          <p className="text-white/70 text-sm mt-1">NHQ Building &amp; Property Management Division</p>
        </div>

        <div className="card">
          {!firebaseConfigured && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2.5">
              Firebase isn't configured yet. Add your project keys to <code>.env</code> — see{" "}
              <strong>README.md → Firebase setup</strong>.
            </div>
          )}

          <div className="flex rounded-xl bg-cbe-purple-50 p-1 mb-5">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 text-sm font-semibold rounded-lg py-2 transition-colors ${
                mode === "login" ? "bg-white shadow-card text-cbe-purple-900" : "text-cbe-slate"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 text-sm font-semibold rounded-lg py-2 transition-colors ${
                mode === "register" ? "bg-white shadow-card text-cbe-purple-900" : "text-cbe-slate"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="label">Full name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="label">Work email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@combanketh.et"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy || !firebaseConfigured} className="btn-primary w-full">
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "register" && (
            <p className="text-xs text-cbe-slate mt-4">
              New accounts start as <strong>Pending</strong>. An administrator will assign your role (Employee,
              Team Leader, Manager, or Admin) from the Users screen before you can access the dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function friendlyError(err) {
  const code = err?.code || "";
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential"))
    return "Incorrect email or password.";
  if (code.includes("email-already-in-use")) return "An account with this email already exists.";
  if (code.includes("weak-password")) return "Password should be at least 6 characters.";
  return err?.message || "Something went wrong. Please try again.";
}
