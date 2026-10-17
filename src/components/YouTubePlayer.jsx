// YouTube video with YouTube's own controls (play, pause, the timeline, full screen).
// The title YouTube lays over the top of the video is hidden: the player is drawn a little
// taller than its frame and moved up, so its top bar (title, share, "watch later") falls
// outside the frame. Subtitles start switched off (members can still turn them on with
// the CC button). Used on every screen with a video.
import { useEffect, useRef } from "react";

// YouTube's player script, loaded once.
let api;
function loadApi() {
  api ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const before = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      before?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return api;
}

export default function YouTubePlayer({ id, title }) {
  const box = useRef(null);

  useEffect(() => {
    let player;
    let cancelled = false;
    let captionsOff = false; // only once per video, so a member who turns them back on keeps them
    loadApi().then((YT) => {
      if (cancelled || !box.current) return;
      const target = document.createElement("div"); // YouTube replaces this with its iframe
      box.current.appendChild(target);
      player = new YT.Player(target, {
        videoId: id,
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3, cc_load_policy: 0 },
        events: {
          onReady: (e) => e.target.getIframe().setAttribute("title", title || "Video"),
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING && !captionsOff) {
              captionsOff = true;
              e.target.unloadModule?.("captions");
              e.target.unloadModule?.("cc");
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [id, title]);

  return <div ref={box} className="yt" />;
}
