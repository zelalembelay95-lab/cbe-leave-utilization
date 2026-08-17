import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from "firebase/auth";
import { auth, firebaseConfigured } from "../firebase";
import { bootstrapUserProfile } from "../services/db";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase auth user
  const [profile, setProfile] = useState(null); // Role profile, stored in Supabase
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          // Gets-or-creates the caller's row in Supabase's app_users table
          // (starts as role "pending" until an admin approves it).
          const p = await bootstrapUserProfile();
          setProfile(p);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("[CBE Leave] could not load profile:", err.message);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    // The next onAuthStateChanged tick calls bootstrapUserProfile() and
    // creates the Supabase row using this displayName/email.
  }

  async function logout() {
    await fbSignOut(auth);
  }

  const value = { user, profile, loading, login, register, logout, firebaseConfigured };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
