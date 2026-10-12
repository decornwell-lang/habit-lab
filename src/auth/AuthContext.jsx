// AuthContext: keeps track of who is logged in, and provides sign-up,
// log-in, log-out and password reset to every page.
// Use it in a page with:  const { user, signUp } = useAuth();
import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` is true until Firebase has told us whether someone is logged in.
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // Creates the login and a member profile in Firestore (collection "users").
  async function signUp({ firstName, surname, email, password, leaderboardOptIn }) {
    requireFirebase();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: firstName });
    await setDoc(doc(db, "users", cred.user.uid), {
      firstName,
      surname,
      email,
      leaderboardOptIn: Boolean(leaderboardOptIn),
      avatar: null,
      role: "member",
      createdAt: serverTimestamp(),
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

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, resetPassword }}>
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
