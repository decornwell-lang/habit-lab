// Draws a square image (1080 x 1080, the size Instagram and others prefer)
// for sharing a badge or a streak on social media, in the brand palette.
//   makeShareImage({ icon: "🌿", title: "12 days", subtitle: "alcohol-free" })

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

export async function makeShareImage({ icon, title, subtitle }) {
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

  // Medallion: navy circle with a gold ring
  ctx.fillStyle = COLOURS.circle;
  ctx.beginPath();
  ctx.arc(size / 2, 440, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLOURS.ring;
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '210px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.fillText(icon, size / 2, 455);

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

// Badge images (kept for the existing badge sharing).
export const makeBadgeImage = (badge) => makeShareImage({ icon: badge.icon, title: badge.label, subtitle: "of practice" });
