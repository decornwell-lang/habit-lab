// Turns a pasted video link into something the page can play.
// Supports YouTube, Vimeo, Google Drive, and direct video files (.mp4 etc.).
export function videoSource(url) {
  if (!url) return null;
  try {
    const u = new URL(url, window.location.origin);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") || u.pathname.split("/").pop();
      return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host === "youtu.be") return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` };
    if (host === "vimeo.com") return { type: "iframe", src: `https://player.vimeo.com/video/${u.pathname.split("/")[1]}` };
    if (host === "player.vimeo.com") return { type: "iframe", src: url };
    if (host === "drive.google.com") {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (match) return { type: "iframe", src: `https://drive.google.com/file/d/${match[1]}/preview` };
    }
    if (/\.(mp4|webm|mov|m4v)$/i.test(u.pathname)) return { type: "video", src: url };
    return { type: "link", src: url };
  } catch {
    return null;
  }
}
