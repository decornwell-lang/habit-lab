// Stripe's payment form shown inside the app (embedded Checkout): card, Apple Pay or
// Google Pay, with the VAT line. Card details go only to Stripe. When the payment
// succeeds: for a signed-in member, the server confirms it and adds them to the cohort
// (confirm-checkout); a visitor creates their account next (Join.jsx), which links it.
// Then onPaid(sessionId) runs. Needs VITE_STRIPE_PUBLISHABLE_KEY; without it, `canEmbed` is false
// and callers use Stripe's own page instead.
import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { apiPost } from "../lib/api.js";
import { auth } from "../firebase.js";

const KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
export const canEmbed = Boolean(KEY);
let stripePromise;

export default function EmbeddedPayment({ cohortId, plan = "cohort", screening, onPaid, onCancel }) {
  const box = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let checkout;
    let cancelled = false;
    (async () => {
      stripePromise ??= loadStripe(KEY);
      const stripe = await stripePromise;
      const { clientSecret, sessionId, joined } = await apiPost("/api/create-checkout", { cohortId, plan, screening, embedded: true });
      if (joined) return onPaid(null);
      if (cancelled) return;
      checkout = await stripe.initEmbeddedCheckout({
        fetchClientSecret: async () => clientSecret,
        onComplete: async () => {
          if (auth.currentUser) await apiPost("/api/confirm-checkout", { sessionId }).catch((err) => setError(err.message));
          onPaid(sessionId);
        },
      });
      if (cancelled) return checkout.destroy();
      checkout.mount(box.current);
      setLoading(false);
    })().catch((err) => {
      setError(err.message || "The payment form couldn't open. Please try again.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
      checkout?.destroy();
    };
  }, [cohortId, plan]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="embedded-payment">
      {loading && <p className="muted small">Opening the secure payment form…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div ref={box} />
      {onCancel && <button type="button" className="btn btn-text" onClick={onCancel}>Cancel</button>}
    </div>
  );
}
