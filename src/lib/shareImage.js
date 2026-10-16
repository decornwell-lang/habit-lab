// Draws a square image (1080 x 1080, the size Instagram and others prefer)
// for sharing a badge or a streak on social media, in the brand palette.
//   makeShareImage({ badge: badgeInfo("d7"), label: "smoke-free" })   a badge: "I earned a 7-day smoke-free badge"
//   makeShareImage({ days: 20, label: "smoke-free" })                 a streak

const COLOURS = {
  background: "#0a0e28", // dark blue
  circle: "#2c3259",     // navy blue
  ring: "#dcb13c",       // yellow gold
  title: "#ffffff",
  subtitle: "#57bda2",   // aqua
  footer: "#dcb13c",
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// One of two pictures, with the DEC logo at the top and the name along the bottom:
//   { badge, label }  the gold badge seal (as in Badge.jsx), with "I earned a 7-day / smoke-free badge" below
//   { days, label }   the streak: the number of days in an aqua ring, with the challenge below
export async function makeShareImage({ badge, days, label }) {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Make sure the app's fonts are ready before drawing text.
  try {
    await Promise.all([document.fonts.load('600 110px "Lora"'), document.fonts.load('600 44px "Inter"')]);
  } catch {
    // Fall back to system fonts.
  }
  const logo = await loadImage("/images/logo-dec.png");

  ctx.fillStyle = COLOURS.background;
  ctx.fillRect(0, 0, size, size);
  if (logo) ctx.drawImage(logo, size / 2 - 90, 70, 180, 73);

  const cx = size / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (badge) {
    drawSeal(ctx, badge, cx, 440, 4.6);
    const [first, second] = badgeLines(badge, label);
    fitText(ctx, first, cx, 785, 84, COLOURS.title, size - 120);
    fitText(ctx, second, cx, 880, 84, COLOURS.subtitle, size - 120);
  } else {
    drawStreak(ctx, days, cx, 480);
    ctx.textAlign = "center";
    fitText(ctx, label.charAt(0).toUpperCase() + label.slice(1), cx, 860, 96, COLOURS.title, size - 120);
  }

  ctx.fillStyle = COLOURS.footer;
  ctx.font = '600 32px "Inter", Helvetica, sans-serif';
  ctx.fillText("T H E   H A B I T   L A B   ·   D A V I D   E R N E S T   C O R N W E L L", size / 2, 1000);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// "I earned a 7-day smoke-free badge", the words that go with a shared badge.
// For a challenge without its own word (label "of practice") it's just "I earned a 7-day badge".
export function badgeHeadline(badge, label) {
  return badgeLines(badge, label).join(" ");
}

// The headline on two lines: ["I earned a 7-day", "smoke-free badge"].
function badgeLines(badge, label) {
  const length = badge.name.replace(/ badge$/, ""); // e.g. "7-day", "6-month", "1-year"
  const article = String(badge.num).startsWith("8") || [11, 18].includes(badge.num) ? "an" : "a"; // "an 8-year"
  return label && label !== "of practice"
    ? [`I earned ${article} ${length}`, `${label} badge`]
    : [`I earned ${article}`, `${length} badge`];
}

// Centred text in Lora, made smaller if it would be wider than maxWidth.
function fitText(ctx, text, x, y, fontSize, colour, maxWidth) {
  let px = fontSize;
  do {
    ctx.font = `600 ${px}px "Lora", Georgia, serif`;
    px -= 4;
  } while (ctx.measureText(text).width > maxWidth && px > 40);
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
}

// Gold star-edged seal with the number and unit inside, drawn on a 100-unit grid.
function drawSeal(ctx, badge, cx, cy, scale) {
  ctx.save();
  ctx.translate(cx - 50 * scale, cy - 50 * scale);
  ctx.scale(scale, scale);
  ctx.beginPath();
  for (let i = 0; i < 48; i++) {
    const rad = i % 2 ? 44 : 49;
    const a = (Math.PI * i) / 24 - Math.PI / 2;
    ctx[i ? "lineTo" : "moveTo"](50 + rad * Math.cos(a), 50 + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = COLOURS.ring;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(50, 50, 36, 0, Math.PI * 2);
  ctx.fillStyle = COLOURS.background;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(50, 50, 31, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(220, 177, 60, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const digits = String(badge.num).length;
  ctx.fillStyle = COLOURS.title;
  ctx.font = `600 ${digits > 1 ? 28 : 34}px "Lora", Georgia, serif`;
  ctx.fillText(String(badge.num), 50, digits > 1 ? 51 : 52);
  ctx.fillStyle = COLOURS.ring;
  ctx.font = '700 9px "Inter", Helvetica, sans-serif';
  ctx.fillText(badge.unit.toUpperCase().split("").join(String.fromCharCode(8202)), 50, 71);
  ctx.restore();
}

// The streak: a big number of days inside an aqua ring.
function drawStreak(ctx, days, cx, cy) {
  ctx.beginPath();
  ctx.arc(cx, cy, 230, 0, Math.PI * 2);
  ctx.strokeStyle = COLOURS.subtitle;
  ctx.lineWidth = 16;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const digits = String(days).length;
  ctx.fillStyle = COLOURS.title;
  ctx.font = `600 ${digits > 2 ? 190 : 250}px "Lora", Georgia, serif`;
  ctx.fillText(String(days), cx, cy - 20);
  ctx.fillStyle = COLOURS.subtitle;
  ctx.font = '700 46px "Inter", Helvetica, sans-serif';
  ctx.fillText((days === 1 ? "DAY" : "DAYS").split("").join(String.fromCharCode(8202)), cx, cy + 135);
}
