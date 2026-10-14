// Draws a square image (1080 x 1080, the size Instagram and others prefer)
// for sharing a badge or a streak on social media, in the brand palette.
//   makeShareImage({ badge: badgeInfo("d7"), title: "12-day streak", subtitle: "alcohol-free" })
// The badge is drawn as the same gold seal as Badge.jsx.

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

export async function makeShareImage({ badge, title, subtitle }) {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Make sure the app's fonts are ready before drawing text.
  try {
    await Promise.all([document.fonts.load('600 110px "Lora"'), document.fonts.load('500 44px "Inter"')]);
  } catch {
    // Fall back to system fonts.
  }
  const logo = await loadImage("/images/logo-dec.png");

  ctx.fillStyle = COLOURS.background;
  ctx.fillRect(0, 0, size, size);

  if (logo) ctx.drawImage(logo, size / 2 - 90, 70, 180, 73);

  // Badge seal: gold star edge, dark face, number and unit (matches Badge.jsx)
  const cx = size / 2, cy = 440, scale = 4.6; // seal drawn on a 100-unit grid
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

  // Text below the badge is centred (restore() reset the alignment).
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = COLOURS.title;
  ctx.font = '600 110px "Lora", Georgia, serif';
  ctx.fillText(title, size / 2, 790);

  ctx.fillStyle = COLOURS.subtitle;
  ctx.font = '500 46px "Inter", Helvetica, sans-serif';
  ctx.fillText(subtitle, size / 2, 880);

  ctx.fillStyle = COLOURS.footer;
  ctx.font = '600 32px "Inter", Helvetica, sans-serif';
  ctx.fillText("T H E   H A B I T   L A B   ·   D A V I D   E R N E S T   C O R N W E L L", size / 2, 1000);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}


