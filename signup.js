// Sign-up form validation.
// For now the account is kept only in this browser (localStorage).
// A real backend for accounts comes in a later step.

const form = document.getElementById("signup-form");

const rules = {
  name: (v) => (v.trim().length >= 2 ? "" : "Please enter your name."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Please enter a valid email address."),
  password: (v) => {
    if (v.length < 8) return "Password must be at least 8 characters.";
    if (!/\d/.test(v)) return "Password must include at least one number.";
    return "";
  },
  goal: (v) => (v ? "" : "Please choose a focus area."),
  terms: (_, el) => (el.checked ? "" : "You need to agree before continuing."),
};

function validateField(name) {
  const el = form.elements[name];
  const message = rules[name](el.value, el);
  const field = el.closest(".field");
  field.classList.toggle("invalid", Boolean(message));
  document.getElementById(`${name}-error`).textContent = message;
  return !message;
}

Object.keys(rules).forEach((name) => {
  const el = form.elements[name];
  el.addEventListener("blur", () => validateField(name));
  el.addEventListener("change", () => {
    if (el.closest(".field").classList.contains("invalid")) validateField(name);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const results = Object.keys(rules).map(validateField);
  if (results.includes(false)) {
    form.querySelector(".invalid input, .invalid select")?.focus();
    return;
  }

  const user = {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    goal: form.elements.goal.value,
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem("habitlab:user", JSON.stringify(user));
  } catch (e) {
    // Storage may be unavailable (private mode); continue anyway.
  }
  window.location.href = "welcome.html";
});
