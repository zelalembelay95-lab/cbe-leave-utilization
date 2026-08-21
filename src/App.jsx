import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Shell from "./components/layout/Shell";
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";
import Overview from "./pages/Overview";
import TeamLeaderSubmit from "./pages/TeamLeaderSubmit";
import EmployeeSelf from "./pages/EmployeeSelf";
import WeeklyReport from "./pages/WeeklyReport";
import MonthlyReport from "./pages/MonthlyReport";
import Balances from "./pages/Balances";
import AdminEmployees from "./pages/AdminEmployees";
import AdminUsers from "./pages/AdminUsers";
import AdminImport from "./pages/AdminImport";

function Gate() {
  const { user, profile, loading, firebaseConfigured } = useAuth();

  if (!firebaseConfigured) return <Login />;
  if (loading) return <SplashScreen />;
  if (!user) return <Login />;
  if (!profile || profile.role === "pending") return <PendingApproval />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomeForRole role={profile.role} />} />
        <Route
          path="/weekly"
          element={
            <RoleRoute allow={["admin", "manager", "team_leader", "employee"]} role={profile.role}>
              <WeeklyReport />
            </RoleRoute>
          }
        />
        <Route
          path="/monthly"
          element={
            <RoleRoute allow={["admin", "manager", "team_leader"]} role={profile.role}>
              <MonthlyReport />
            </RoleRoute>
          }
        />
        <Route
          path="/balances"
          element={
            <RoleRoute allow={["admin", "manager"]} role={profile.role}>
              <Balances />
            </RoleRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <RoleRoute allow={["admin"]} role={profile.role}>
              <AdminEmployees />
            </RoleRoute>
          }
        />
        <Route
          path="/users"
          element={
            <RoleRoute allow={["admin"]} role={profile.role}>
              <AdminUsers />
            </RoleRoute>
          }
        />
        <Route
          path="/import"
          element={
            <RoleRoute allow={["admin"]} role={profile.role}>
              <AdminImport />
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

function HomeForRole({ role }) {
  if (role === "admin" || role === "manager") return <Overview />;
  if (role === "team_leader") return <TeamLeaderSubmit />;
  if (role === "employee") return <EmployeeSelf />;
  return <PendingApproval />;
}

function RoleRoute({ allow, role, children }) {
  if (!allow.includes(role)) return <Navigate to="/" replace />;
  return children;
}

function SplashScreen() {
  return (
    <div className="min-h-screen bg-cbe-hero flex items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-white/95 flex items-center justify-center p-2 shadow-card animate-pulse">
        <img src="/cbe-logo.svg" alt="Commercial Bank of Ethiopia" className="w-full h-full object-contain" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
