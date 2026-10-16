// Stripe's payment form shown inside the app (embedded Checkout): card, Apple Pay or
// Google Pay, with the VAT line. Card details go only to Stripe. When the payment
// succeeds, the server confirms it and adds the member to the cohort (confirm-checkout),
// then onPaid() runs. Needs VITE_STRIPE_PUBLISHABLE_KEY; without it, `canEmbed` is false
// and callers use Stripe's own page instead.
import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { apiPost } from "../lib/api.js";

const KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
export const canEmbed = Boolean(KEY);
let stripePromise;

export default function EmbeddedPayment({ cohortId, screening, onPaid, onCancel }) {
  const box = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let checkout;
    let cancelled = false;
    (async () => {
      stripePromise ??= loadStripe(KEY);
      const stripe = await stripePromise;
      const { clientSecret, sessionId, joined } = await apiPost("/api/create-checkout", { cohortId, screening, embedded: true });
      if (joined) return onPaid();
      if (cancelled) return;
      checkout = await stripe.initEmbeddedCheckout({
        fetchClientSecret: async () => clientSecret,
        onComplete: async () => {
          await apiPost("/api/confirm-checkout", { sessionId }).catch((err) => setError(err.message));
          onPaid();
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
  }, [cohortId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="embedded-payment">
      {loading && <p className="muted small">Opening the secure payment form…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div ref={box} />
      {onCancel && <button type="button" className="btn btn-text" onClick={onCancel}>Cancel</button>}
    </div>
  );
}
