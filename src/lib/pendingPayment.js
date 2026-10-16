// A visitor's payment (Stripe session id) for a cohort, kept on this device from paying
// until their account is created, which links it (see Join.jsx).
const key = (cohortId) => `habitlab:paid:${cohortId}`;

export function getPendingPayment(cohortId) {
  try {
    return localStorage.getItem(key(cohortId));
  } catch {
    return null;
  }
}

export function setPendingPayment(cohortId, sessionId) {
  try {
    localStorage.setItem(key(cohortId), sessionId);
  } catch {
    // Not remembered: they'll be asked to log in with the email they paid with.
  }
}

export function clearPendingPayment(cohortId) {
  try {
    localStorage.removeItem(key(cohortId));
  } catch {
    // Nothing to remove.
  }
}
