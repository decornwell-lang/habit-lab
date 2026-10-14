// Mobile number with a country code drop-down.
// `value` and onChange use the full international number, e.g. "+447700900123".
// The country starts as the one from the phone's language settings (e.g. en-GB → +44).
import { useState } from "react";
import { COUNTRY_CODES } from "../content/countryCodes.js";
import { normalizePhone } from "../lib/phone.js";

const flag = (iso) => String.fromCodePoint(...[...iso].map((c) => 0x1f1a5 + c.charCodeAt(0)));

function guessCode() {
  const region = (navigator.language || "").split("-")[1]?.toUpperCase();
  return (COUNTRY_CODES.find(([iso]) => iso === region) || COUNTRY_CODES[0])[1];
}

// Splits "+447700900123" into "+44" and "7700900123" (longest matching code wins).
function split(value) {
  const n = normalizePhone(value || "");
  const match = COUNTRY_CODES.map(([, code]) => code)
    .filter((code) => n.startsWith(code))
    .sort((a, b) => b.length - a.length)[0];
  return match ? [match, n.slice(match.length)] : [guessCode(), n.replace(/^\+/, "")];
}

export default function PhoneInput({ id = "phone", value, onChange }) {
  const [initialCode, initialNumber] = split(value);
  const [code, setCode] = useState(initialCode);
  const [number, setNumber] = useState(initialNumber);

  function update(nextCode, nextNumber) {
    setCode(nextCode);
    setNumber(nextNumber);
    // Drop a leading 0 (e.g. UK "07700…" becomes +44 7700…). Empty number → empty value.
    const digits = nextNumber.replace(/\D/g, "").replace(/^0+/, "");
    onChange(digits ? `${nextCode}${digits}` : "");
  }

  return (
    <div className="phone-input">
      <select aria-label="Country code" value={code} onChange={(e) => update(e.target.value, number)}>
        {COUNTRY_CODES.map(([iso, dial, name]) => (
          <option key={iso} value={dial} title={name}>{flag(iso)} {dial}</option>
        ))}
      </select>
      <input id={id} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="7700 900123"
        value={number} onChange={(e) => update(code, e.target.value)} />
    </div>
  );
}
