// AuthContext: keeps track of who is logged in (and their profile), and
// provides sign-up, log-in, log-out and password reset to every page.
// Use it in a page with:  const { user, profile, isAdmin, signUp } = useAuth();
import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // the users/{uid} document
  // `loading` is true until Firebase has told us whether someone is logged in.
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    let stopProfile = () => {};
    const stopAuth = onAuthStateChanged(auth, (u) => {
      stopProfile();
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      // Keep the profile up to date live (e.g. after changing settings).
      stopProfile = onSnapshot(
        doc(db, "users", u.uid),
        (snap) => {
          setProfile(snap.exists() ? snap.data() : null);
          setLoading(false);
        },
        () => setLoading(false)
      );
    });
    return () => {
      stopProfile();
      stopAuth();
    };
  }, []);

  // Creates the login, the private profile ("users") and the public
  // profile ("publicProfiles": first name and avatar only).
  async function signUp({ firstName, surname, email, password, phone, leaderboardOptIn }) {
    requireFirebase();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    await updateProfile(cred.user, { displayName: firstName });
    await setDoc(doc(db, "users", uid), {
      firstName,
      surname,
      email,
      phone: phone || null, // private: only the owner sees it
      leaderboardOptIn: Boolean(leaderboardOptIn),
      avatar: null,
      role: "member",
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, "publicProfiles", uid), {
      firstName,
      avatar: null,
      leaderboardOptIn: Boolean(leaderboardOptIn),
      streak: 0,
      lastYesDate: null,
      badges: [],
      updatedAt: serverTimestamp(),
    });
    return cred.user;
  }

  async function logIn(email, password) {
    requireFirebase();
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logOut() {
    if (auth) await signOut(auth);
  }

  async function resetPassword(email) {
    requireFirebase();
    return sendPasswordResetEmail(auth, email);
  }

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signUp, logIn, logOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function requireFirebase() {
  if (!isFirebaseConfigured) {
    const err = new Error("Firebase is not connected yet.");
    err.code = "app/not-configured";
    throw err;
  }
}

// Turns Firebase error codes into friendly messages for members.
export function friendlyAuthError(err) {
  const messages = {
    "app/not-configured": "Accounts aren't switched on yet. Please check back soon.",
    "auth/email-already-in-use": "There's already an account with this email. Try logging in instead.",
    "auth/invalid-email": "That email address doesn't look quite right.",
    "auth/weak-password": "Please choose a password with at least 8 characters.",
    "auth/invalid-credential": "That email and password don't match. Please try again.",
    "auth/user-not-found": "That email and password don't match. Please try again.",
    "auth/wrong-password": "That email and password don't match. Please try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/network-request-failed": "We couldn't connect. Please check your internet and try again.",
  };
  return messages[err?.code] || "Something went wrong. Please try again.";
}
