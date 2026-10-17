// YouTube video with YouTube's own controls (play, pause, the timeline, full screen).
// The title YouTube lays over the top of the video is hidden: the player is drawn a little
// taller than its frame and moved up, so its top bar (title, share, "watch later") falls
// outside the frame. Subtitles start switched off (members can still turn them on with
// the CC button). Before it plays, every video shows the same title card: David's photo
// with a red play button in the middle (no YouTube title or thumbnail). Used on every
// screen with a video.
import { useEffect, useRef, useState } from "react";
import { site } from "../content/site.js";

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
  const player = useRef(null);
  const playWhenReady = useRef(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStarted(false);
    let captionsOff = false; // only once per video, so a member who turns them back on keeps them
    loadApi().then((YT) => {
      if (cancelled || !box.current) return;
      const target = document.createElement("div"); // YouTube replaces this with its iframe
      box.current.appendChild(target);
      player.current = new YT.Player(target, {
        videoId: id,
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3, cc_load_policy: 0 },
        events: {
          onReady: (e) => {
            e.target.getIframe().setAttribute("title", title || "Video");
            if (playWhenReady.current) e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setStarted(true);
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
      player.current?.destroy();
      player.current = null;
    };
  }, [id, title]);

  // The title card: tapping it starts the video (the player is already loaded underneath).
  function play() {
    setStarted(true);
    if (player.current?.playVideo) player.current.playVideo();
    else playWhenReady.current = true; // still loading: start as soon as it's ready
  }

  return (
    <div ref={box} className="yt">
      {!started && (
        <button type="button" className="yt-card" onClick={play} aria-label={`Play ${title || "video"}`}>
          <img src={site.photo} alt="" />
          <span className="yt-card-play" aria-hidden="true">
            <svg viewBox="0 0 68 48" width="68" height="48">
              <path d="M66.5 7.7c-.8-2.9-3-5.2-5.9-6C55.3.3 34 .3 34 .3s-21.3 0-26.6 1.4c-2.9.8-5.1 3.1-5.9 6C.1 13 .1 24 .1 24s0 11 1.4 16.3c.8 2.9 3 5.1 5.9 5.9C12.7 47.7 34 47.7 34 47.7s21.3 0 26.6-1.5c2.9-.8 5.1-3 5.9-5.9C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#f00" />
              <path d="M45 24 27 14v20z" fill="#fff" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
