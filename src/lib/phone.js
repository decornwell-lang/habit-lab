// Phone number helpers. Numbers are stored in international format,
// e.g. "+447700900123", so WhatsApp links work in any country.

// Keeps a leading "+" and the digits; turns a leading "00" into "+".
export function normalizePhone(input = "") {
  let s = input.trim().replace(/[^\d+]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  return s;
}

// Valid if it starts with "+" (country code) and has 8 to 15 digits.
export function isValidPhone(input) {
  const s = normalizePhone(input);
  return /^\+\d{8,15}$/.test(s);
}

// Opens a WhatsApp chat with this number.
export const whatsAppLink = (phone) => `https://wa.me/${normalizePhone(phone).replace("+", "")}`;
