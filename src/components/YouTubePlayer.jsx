// A clean YouTube player: the video's picture with our own round play button, and only
// play/pause and full screen. YouTube's title, logo and suggestions are hidden: its player
// is made a little taller than the frame so its top and bottom bars are cut off, and a
// see-through layer on top takes the taps, so YouTube's own controls never appear.
import { useEffect, useRef, useState } from "react";

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
  const frame = useRef(null);
  const player = useRef(null);
  const playWhenReady = useRef(false);
  const [state, setState] = useState("idle"); // idle, playing, paused or ended
  const [fullScreen, setFullScreen] = useState(false); // real full screen, or (iPhone) filling the screen

  // The player is made straight away, hidden under the picture, so the first tap can start it.
  useEffect(() => {
    let cancelled = false;
    loadApi().then((YT) => {
      if (cancelled || !frame.current) return;
      const target = document.createElement("div"); // YouTube replaces this with its iframe
      frame.current.appendChild(target);
      player.current = new YT.Player(target, {
        videoId: id,
        host: "https://www.youtube-nocookie.com",
        playerVars: { controls: 0, rel: 0, playsinline: 1, iv_load_policy: 3, disablekb: 1, fs: 0 },
        events: {
          onReady: (e) => playWhenReady.current && e.target.playVideo(),
          onStateChange: (e) => {
            const S = YT.PlayerState;
            if (e.data === S.PLAYING) setState("playing");
            else if (e.data === S.PAUSED) setState("paused");
            else if (e.data === S.ENDED) setState("ended");
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
    };
  }, [id]);

  useEffect(() => {
    const onChange = () => setFullScreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  function playPause() {
    if (state === "playing") return player.current?.pauseVideo();
    if (player.current?.playVideo) player.current.playVideo();
    else playWhenReady.current = true; // still loading: start as soon as it's ready
  }

  function toggleFullScreen() {
    const el = box.current;
    if (document.fullscreenElement) return document.exitFullscreen();
    if (document.webkitFullscreenElement) return document.webkitExitFullscreen();
    if (el.requestFullscreen) return el.requestFullscreen().catch(() => setFullScreen((f) => !f));
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    setFullScreen((f) => !f); // iPhone: the player fills the screen instead
  }

  const started = state === "playing" || state === "paused";
  return (
    <div ref={box} className={`yt ${fullScreen ? "full" : ""}`}>
      <div ref={frame} className="yt-frame" />
      {/* YouTube's picture of the video; hidden if YouTube only has its grey "no image" placeholder (120px wide) */}
      {!started && (
        <img className="yt-poster" src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt=""
          onLoad={(e) => e.currentTarget.naturalWidth <= 120 && (e.currentTarget.style.display = "none")} />
      )}
      <button type="button" className="yt-layer" onClick={playPause} aria-label={state === "playing" ? `Pause ${title}` : `Play ${title}`}>
        {state !== "playing" && (
          <span className="yt-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
          </span>
        )}
      </button>
      {started && (
        <div className="yt-controls">
          <button type="button" onClick={playPause} aria-label={state === "playing" ? "Pause" : "Play"}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              {state === "playing"
                ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
                : <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />}
            </svg>
          </button>
          <button type="button" onClick={toggleFullScreen} aria-label={fullScreen ? "Exit full screen" : "Full screen"}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {fullScreen
                ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
                : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
