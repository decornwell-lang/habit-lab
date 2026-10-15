// AuthContext: keeps track of who is logged in (and their profile), and
// provides sign-up, log-in (password or emailed link), log-out and password
// changes to every page.
// Use it in a page with:  const { user, profile, isAdmin, signUp } = useAuth();
import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase.js";

const AuthContext = createContext(null);
const LINK_EMAIL_KEY = "habitlab:loginLinkEmail";

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
  async function signUp({ firstName, surname, email, password, phone, reflectionConsent }) {
    requireFirebase();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    await updateProfile(cred.user, { displayName: firstName });
    await setDoc(doc(db, "users", uid), {
      firstName,
      surname,
      email,
      phone: phone || null, // private: only the owner sees it
      leaderboardOptIn: null, // asked on Home once they join a cohort (LeaderboardInvite.jsx)
      reflectionConsent: Boolean(reflectionConsent), // David may read their reflections (off unless ticked)
      avatar: null,
      role: "member",
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, "publicProfiles", uid), {
      firstName,
      avatar: null,
      leaderboardOptIn: false,
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

  // "Forgot password?": emails a one-tap log-in link (a "magic link").
  // The email is remembered on this device, so the link logs straight in when opened here.
  async function sendLoginLink(email) {
    requireFirebase();
    await sendSignInLinkToEmail(auth, email, { url: `${window.location.origin}/login`, handleCodeInApp: true });
    try {
      localStorage.setItem(LINK_EMAIL_KEY, email);
    } catch {
      // Not saved: they'll be asked for their email when they open the link.
    }
  }

  // The email the link was sent to, if it was sent from this device.
  function linkEmail() {
    try {
      return localStorage.getItem(LINK_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  }

  async function finishLinkLogin(email) {
    requireFirebase();
    await signInWithEmailLink(auth, email, window.location.href);
    try {
      localStorage.removeItem(LINK_EMAIL_KEY);
    } catch {
      // Nothing to tidy up.
    }
  }

  const isLoginLink = () => Boolean(auth) && isSignInWithEmailLink(auth, window.location.href);

  async function changePassword(password) {
    requireFirebase();
    return updatePassword(auth.currentUser, password);
  }

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signUp, logIn, logOut, sendLoginLink, linkEmail, finishLinkLogin, isLoginLink, changePassword }}>
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
    "auth/invalid-action-code": "This log-in link has expired or was already used. Please ask for a new one.",
    "auth/expired-action-code": "This log-in link has expired. Please ask for a new one.",
    "auth/requires-recent-login": "Please log in again, then set your new password.",
  };
  return messages[err?.code] || "Something went wrong. Please try again.";
}
