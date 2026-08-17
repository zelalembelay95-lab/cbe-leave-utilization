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
    <div className="min-h-screen bg-cbe-purple-50 flex items-stretch">
      {/* Left: brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-cbe-hero">
        {/* decorative glow shapes */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cbe-gold-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-cbe-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <div className="flex items-center gap-3">
            <img src="/cbe-logo.svg" alt="Commercial Bank of Ethiopia" className="w-12 h-12 drop-shadow" />
            <div>
              <p className="font-display font-semibold text-lg leading-tight">Commercial Bank of Ethiopia</p>
              <p className="text-xs text-white/60 leading-tight">NHQ Building &amp; Property Management</p>
            </div>
          </div>

          <div className="max-w-md">
            <span className="inline-block text-xs font-semibold tracking-wide uppercase text-cbe-gold-300 bg-white/10 rounded-full px-3 py-1 mb-5">
              Internal Staff Portal
            </span>
            <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-tight">
              Leave Utilization,<br />handled end to end.
            </h1>
            <p className="mt-5 text-white/70 text-base leading-relaxed">
              Submit weekly leave, roll it up into monthly reports automatically, and track every
              employee's balance against December's no-carry-over deadline all in one place.
            </p>
            <div className="mt-8 flex gap-6 text-sm text-white/60">
              <div>
                <p className="font-display text-2xl font-semibold text-white">4</p>
                <p>Role types</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-white">Weekly</p>
                <p>Reporting cadence</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-white">Live</p>
                <p>Balance tracking</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/40">© {new Date().getFullYear()} Commercial Bank of Ethiopia</p>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img src="/cbe-logo.svg" alt="Commercial Bank of Ethiopia" className="mx-auto w-16 h-16 drop-shadow" />
            <h1 className="mt-4 font-display text-xl font-semibold text-cbe-ink">Leave Utilization</h1>
            <p className="text-cbe-slate text-sm mt-1">NHQ Building &amp; Property Management Division</p>
          </div>

          <div className="bg-white rounded-3xl shadow-card border border-cbe-purple-100 p-7 sm:p-9">
            <div className="hidden lg:block mb-6">
              <h2 className="font-display text-2xl font-semibold text-cbe-ink">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-cbe-slate text-sm mt-1">
                {mode === "login" ? "Sign in to continue to your dashboard." : "It only takes a minute."}
              </p>
            </div>

            {!firebaseConfigured && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2.5">
                Firebase isn't configured yet. Add your project keys to <code>.env</code>   see{" "}
                <strong>README.md → Go live</strong>.
              </div>
            )}

            <div className="flex rounded-xl bg-cbe-purple-50 p-1 mb-6">
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
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cbe-slate/60 text-sm">✉</span>
                  <input
                    type="email"
                    className="input pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@combanketh.et"
                  />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cbe-slate/60 text-sm">🔒</span>
                  <input
                    type="password"
                    className="input pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={busy || !firebaseConfigured} className="btn-primary w-full py-3">
                {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            {mode === "register" && (
              <p className="text-xs text-cbe-slate mt-5 leading-relaxed">
                New accounts start as <strong>Pending</strong>. An administrator will assign your role (Employee,
                Team Leader, Manager, or Admin) from the Users screen before you can access the dashboard.
              </p>
            )}
          </div>

          <p className="lg:hidden text-center text-xs text-cbe-slate mt-6">
            © {new Date().getFullYear()} Commercial Bank of Ethiopia
          </p>
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
