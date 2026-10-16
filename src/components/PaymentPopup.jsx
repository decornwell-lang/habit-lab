// The payment pop-up: Join opens a window over the page with two choices, the 33-day
// cohort (its price) or the cohort plus a full year (config/pricing.json), then Stripe's
// payment form (EmbeddedPayment.jsx), with the cohort at the top and ✕ to close.
// If the in-app form isn't set up (no VITE_STRIPE_PUBLISHABLE_KEY), "Continue to payment"
// goes to Stripe's own page instead, and Stripe brings them back to the join steps.
import { useState } from "react";
import { apiPost } from "../lib/api.js";
import { formatPrice } from "../lib/cohorts.js";
import pricing from "../../config/pricing.json";
import EmbeddedPayment, { canEmbed } from "./EmbeddedPayment.jsx";

export default function PaymentPopup({ cohort, screening, onPaid, onClose }) {
  const [plan, setPlan] = useState("cohort");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const yearPrice = pricing.products.year.price;
  const extendPrice = pricing.products.extension.price;
  const saving = Number(cohort.price) + extendPrice - yearPrice;

  async function goToStripe() {
    setBusy(true);
    try {
      const { url, joined } = await apiPost("/api/create-checkout", { cohortId: cohort.id, plan, screening, returnPath: `/join/${cohort.id}` });
      if (joined) onPaid(null);
      else window.location.href = url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="payment-popup" role="dialog" aria-label={`Pay for ${cohort.name}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="payment-popup-panel">
        <div className="payment-popup-head">
          <strong>{cohort.name}</strong>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="plan-choices" role="radiogroup" aria-label="Choose how long">
          <button type="button" role="radio" aria-checked={plan === "cohort"} className={plan === "cohort" ? "selected" : ""} onClick={() => setPlan("cohort")}>
            <strong>{cohort.durationDays} days</strong>
            <span className="plan-price">{formatPrice(cohort)}</span>
            <span className="muted small">The cohort</span>
          </button>
          <button type="button" role="radio" aria-checked={plan === "year"} className={plan === "year" ? "selected" : ""} onClick={() => setPlan("year")}>
            <strong>Full year</strong>
            <span className="plan-price">€{yearPrice}</span>
            <span className="muted small">{saving > 0 ? `Save €${saving}: extending later is €${extendPrice} more` : "The cohort, then a full year"}</span>
          </button>
        </div>
        <p className="muted small plan-vat">VAT included.</p>

        {error && <p className="form-error" role="alert">{error}</p>}
        {canEmbed ? (
          <EmbeddedPayment key={plan} cohortId={cohort.id} plan={plan} screening={screening} onPaid={onPaid} />
        ) : (
          <button className="btn btn-primary" disabled={busy} onClick={goToStripe}>{busy ? "Opening Stripe…" : "Continue to payment"}</button>
        )}
      </div>
    </div>
  );
}
