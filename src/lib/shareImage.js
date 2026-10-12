// Draws a square badge image (1080 x 1080, the size Instagram and others
// prefer) for sharing on social media. Colours match the app's theme.
// For privacy, the image never mentions which habit the member is working on.

export async function makeBadgeImage(badge) {
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

  ctx.fillStyle = "#f8f5ef"; // off-white background
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#e7eee8"; // soft sage circle
  ctx.beginPath();
  ctx.arc(size / 2, 420, 240, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '230px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.fillText(badge.icon, size / 2, 435);

  ctx.fillStyle = "#2f3a40"; // dark slate
  ctx.font = '600 110px "Lora", Georgia, serif';
  ctx.fillText(badge.label, size / 2, 770);

  ctx.fillStyle = "#66727a";
  ctx.font = '500 46px "Inter", Helvetica, sans-serif';
  ctx.fillText("of practice", size / 2, 860);

  ctx.fillStyle = "#c27c5e"; // terracotta
  ctx.font = '600 34px "Inter", Helvetica, sans-serif';
  ctx.fillText("T H E   H A B I T   L A B", size / 2, 985);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
