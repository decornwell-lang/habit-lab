// The payment pop-up: Join opens Stripe's payment form in a window over the page
// (EmbeddedPayment.jsx), with the cohort and price at the top and ✕ to close.
// If the in-app form isn't set up (no VITE_STRIPE_PUBLISHABLE_KEY), it goes straight to
// Stripe's own page instead, and Stripe brings them back to the join steps.
import { useEffect, useState } from "react";
import { apiPost } from "../lib/api.js";
import { formatPrice } from "../lib/cohorts.js";
import EmbeddedPayment, { canEmbed } from "./EmbeddedPayment.jsx";

export default function PaymentPopup({ cohort, screening, onPaid, onClose }) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (canEmbed) return;
    apiPost("/api/create-checkout", { cohortId: cohort.id, screening, returnPath: `/join/${cohort.id}` })
      .then(({ url, joined }) => (joined ? onPaid(null) : (window.location.href = url)))
      .catch((err) => setError(err.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="payment-popup" role="dialog" aria-label={`Pay for ${cohort.name}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="payment-popup-panel">
        <div className="payment-popup-head">
          <div>
            <strong>{cohort.name}</strong>
            <span className="muted small">{formatPrice(cohort)} · VAT included</span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {canEmbed ? (
          <EmbeddedPayment cohortId={cohort.id} screening={screening} onPaid={onPaid} />
        ) : (
          !error && <p className="muted small">Opening Stripe's secure payment page…</p>
        )}
      </div>
    </div>
  );
}
