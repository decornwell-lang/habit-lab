import assert from "node:assert/strict";
import Stripe from "stripe";
import { subscriptionRecord } from "../api/_lib/studyGroup.js";
const meta = { uid: "u1", termsVersion: "2026-10-draft", termsAcceptedAt: "2026-10-17T10:00:00.000Z", immediateAccess: "true" };
// older layout: dates on the subscription
let r = subscriptionRecord({ id: "sub_1", customer: "cus_1", status: "active", current_period_start: 1792000000, current_period_end: 1823536000, cancel_at_period_end: true, metadata: meta });
assert.equal(r.uid, "u1"); assert.equal(r.status, "active"); assert.equal(r.cancelAtPeriodEnd, true); assert.equal(r.immediateAccess, true);
assert.equal(r.currentPeriodEnd.toISOString(), new Date(1823536000e3).toISOString());
// newer layout: dates on the item
r = subscriptionRecord({ id: "sub_2", customer: { id: "cus_2" }, status: "canceled", items: { data: [{ current_period_start: 1, current_period_end: 2 }] }, metadata: {} });
assert.equal(r.stripeCustomerId, "cus_2"); assert.equal(r.currentPeriodEnd.getTime(), 2000); assert.equal(r.uid, null); assert.equal(r.immediateAccess, false);
// signature check
const stripe = new Stripe("sk_test_dummy"); const secret = "whsec_test";
const payload = JSON.stringify({ id: "evt_1", type: "invoice.paid", data: { object: {} } });
const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
assert.equal(stripe.webhooks.constructEvent(Buffer.from(payload), header, secret).id, "evt_1");
assert.throws(() => stripe.webhooks.constructEvent(Buffer.from(payload.replace("evt_1", "evt_2")), header, secret));
console.log("Webhook record and signature checks pass");
