// YouTube video with YouTube's own controls (play, pause, the timeline, full screen).
// The title YouTube lays over the top of the video is hidden: the player is drawn a little
// taller than its frame and moved up, so its top bar (title, share, "watch later") falls
// outside the frame. Used on every screen with a video.
export default function YouTubePlayer({ id, title }) {
  const params = new URLSearchParams({ rel: "0", playsinline: "1", modestbranding: "1", iv_load_policy: "3" });
  return (
    <div className="yt">
      <iframe className="yt-frame" src={`https://www.youtube-nocookie.com/embed/${id}?${params}`} title={title}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
    </div>
  );
}
