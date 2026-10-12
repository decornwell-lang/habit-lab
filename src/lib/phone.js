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

// WhatsApp group invite links look like https://chat.whatsapp.com/AbCdEf123456
// Returns the clean link, or null if it isn't one.
export function cleanGroupLink(input = "") {
  const match = input.trim().match(/^(?:https?:\/\/)?chat\.whatsapp\.com\/([A-Za-z0-9]{10,40})/);
  return match ? `https://chat.whatsapp.com/${match[1]}` : null;
}

// Opens a WhatsApp chat with this number.
export const whatsAppLink = (phone) => `https://wa.me/${normalizePhone(phone).replace("+", "")}`;
