// Turns a pasted video link into something the page can play.
// Supports YouTube, Vimeo, Google Drive, direct video files (.mp4 etc.) and audio files (.mp3 etc.).
export function videoSource(url) {
  if (!url) return null;
  try {
    const u = new URL(url, window.location.origin);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube (watch, shorts, embed and youtu.be links): played with our own clean player.
    if (host === "youtube.com" || host === "m.youtube.com") return { type: "youtube", id: u.searchParams.get("v") || u.pathname.split("/").pop() };
    if (host === "youtu.be") return { type: "youtube", id: u.pathname.slice(1) };
    if (host === "vimeo.com") return { type: "iframe", src: `https://player.vimeo.com/video/${u.pathname.split("/")[1]}` };
    if (host === "player.vimeo.com") return { type: "iframe", src: url };
    if (host === "drive.google.com") {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (match) return { type: "iframe", src: `https://drive.google.com/file/d/${match[1]}/preview` };
    }
    if (/\.(mp4|webm|mov|m4v)$/i.test(u.pathname)) return { type: "video", src: url };
    if (/\.(mp3|m4a|aac|wav|ogg)$/i.test(u.pathname)) return { type: "audio", src: url };
    return { type: "link", src: url };
  } catch {
    return null;
  }
}
