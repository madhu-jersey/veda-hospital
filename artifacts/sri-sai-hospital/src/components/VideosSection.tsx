import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';

const youtubeChannel = 'https://www.youtube.com/channel/UCoZrqTftw_z7tXwagHrw2oA';

const videos = [
  { id: 'aqTzReeaaTY', title: 'DEALING WITH EXAMNATION' },
  { id: 'g-w7LMnzEa4', title: 'MEDICATIONS DURING COVID VACCINATION?' },
  { id: '-HCu-2afK34', title: 'HOW TO DEAL WITH STRESS PART 1' },
];

type YouTubePlayerStateEvent = { data: number };
type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string) => void;
  mute: () => void;
  unMute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  setVolume: (volume: number) => void;
};
type YouTubeApi = {
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
  Player: new (
    element: HTMLElement,
    options: {
      host: string;
      videoId: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onStateChange: (event: YouTubePlayerStateEvent) => void;
        onError: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null;

function formatTime(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, '0')}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
}

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const scriptUrl = 'https://www.youtube.com/iframe_api';
    const script = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`) ?? document.createElement('script');
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT?.Player) resolve(window.YT);
      else {
        youtubeApiPromise = null;
        reject(new Error('YouTube IFrame Player API did not initialize.'));
      }
    };
    script.src = scriptUrl;
    script.async = true;
    script.onerror = () => {
      youtubeApiPromise = null;
      reject(new Error('Unable to load the YouTube IFrame Player API.'));
    };
    if (!script.isConnected) document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

export function VideosSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const sectionRef = useRef<HTMLElement>(null);
  const videoFrameRef = useRef<HTMLDivElement>(null);
  const playerMountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const apiRef = useRef<YouTubeApi | null>(null);
  const activeIndexRef = useRef(activeIndex);
  const sectionVisibleRef = useRef(false);
  const isPlayingRef = useRef(false);
  const playerCreatedRef = useRef(false);
  const playerReadyRef = useRef(false);
  const hasStartedRef = useRef(false);
  const resumeOnReturnRef = useRef(false);
  const selectVideoRef = useRef<(index: number) => void>(() => undefined);
  const progressFillRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const totalTimeRef = useRef<HTMLSpanElement>(null);
  const progressFrameRef = useRef(0);
  const switchTimerRef = useRef(0);
  const activeVideo = videos[activeIndex];

  activeIndexRef.current = activeIndex;

  const stopProgress = useCallback(() => {
    if (progressFrameRef.current) window.cancelAnimationFrame(progressFrameRef.current);
    progressFrameRef.current = 0;
  }, []);

  const startProgress = useCallback(() => {
    stopProgress();
    const update = () => {
      const player = playerRef.current;
      const duration = player?.getDuration() ?? 0;
      const current = player?.getCurrentTime() ?? 0;
      const progress = duration > 0 ? Math.min(1, current / duration) : 0;
      if (progressFillRef.current) progressFillRef.current.style.transform = `scaleX(${progress})`;
      if (progressBarRef.current) progressBarRef.current.setAttribute('aria-valuenow', `${Math.round(progress * 100)}`);
      if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(current);
      if (totalTimeRef.current) totalTimeRef.current.textContent = formatTime(duration);
      if (isPlayingRef.current) {
        progressFrameRef.current = window.requestAnimationFrame(update);
      } else {
        progressFrameRef.current = 0;
      }
    };
    progressFrameRef.current = window.requestAnimationFrame(update);
  }, [stopProgress]);

  const selectVideo = useCallback((index: number) => {
    if (index < 0 || index >= videos.length) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const playerRect = videoFrameRef.current?.getBoundingClientRect();
    if (playerRect && (playerRect.top < 0 || playerRect.bottom > window.innerHeight)) {
      videoFrameRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
    }
    if (index === activeIndexRef.current) return;
    activeIndexRef.current = index;
    isPlayingRef.current = false;
    setActiveIndex(index);
    setIsPlaying(false);
    setIsSwitching(!prefersReducedMotion);
    if (progressFillRef.current) progressFillRef.current.style.transform = 'scaleX(0)';
    if (progressBarRef.current) progressBarRef.current.setAttribute('aria-valuenow', '0');
    if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    if (prefersReducedMotion) setIsSwitching(false);
    else switchTimerRef.current = window.setTimeout(() => setIsSwitching(false), 350);
    const player = playerRef.current;
    player?.loadVideoById(videos[index].id);
    if (player && sectionVisibleRef.current) player.playVideo();

  }, []);
  selectVideoRef.current = selectVideo;

  useEffect(() => {
    const iframe = videoFrameRef.current?.querySelector<HTMLIFrameElement>('iframe');
    if (iframe) iframe.title = activeVideo.title;
  }, [activeVideo.title, isPlayerReady]);

  useEffect(() => {
    const section = sectionRef.current;
    const mount = playerMountRef.current;
    if (!section || !mount) return;
    let disposed = false;

    const createPlayer = (api: YouTubeApi) => {
      if (disposed || !sectionVisibleRef.current || playerCreatedRef.current) return;
      playerCreatedRef.current = true;
      try {
        playerRef.current = new api.Player(mount, {
          host: 'https://www.youtube-nocookie.com',
          videoId: videos[activeIndexRef.current].id,
          playerVars: {
            autoplay: 1,
            controls: 0,
            mute: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: ({ target }) => {
              if (disposed) {
                target.destroy();
                return;
              }
              playerReadyRef.current = true;
              setIsPlayerReady(true);
              const iframe = videoFrameRef.current?.querySelector<HTMLIFrameElement>('iframe');
              if (iframe) iframe.title = videos[activeIndexRef.current].title;
              target.mute();
              setIsMuted(true);
              if (activeIndexRef.current !== 0) target.loadVideoById(videos[activeIndexRef.current].id);
              if (sectionVisibleRef.current) {
                hasStartedRef.current = true;
                target.playVideo();
              } else {
                target.pauseVideo();
              }
            },
            onStateChange: ({ data }) => {
              if (disposed) return;
              const currentApi = apiRef.current;
              if (!currentApi) return;
              if (data === currentApi.PlayerState.PLAYING) {
                hasStartedRef.current = true;
                isPlayingRef.current = true;
                setIsPlaying(true);
                setIsSwitching(false);
                startProgress();
              } else if (data === currentApi.PlayerState.PAUSED || data === currentApi.PlayerState.ENDED) {
                isPlayingRef.current = false;
                setIsPlaying(false);
                stopProgress();
                if (data === currentApi.PlayerState.ENDED) {
                  if (progressFillRef.current) progressFillRef.current.style.transform = 'scaleX(1)';
                  if (progressBarRef.current) progressBarRef.current.setAttribute('aria-valuenow', '100');
                  selectVideoRef.current((activeIndexRef.current + 1) % videos.length);
                }
              }
            },
            onError: ({ data }) => {
              if (disposed) return;
              isPlayingRef.current = false;
              setPlayerError(`YouTube could not play this video (error ${data}).`);
              setIsPlaying(false);
              stopProgress();
            },
          },
        });
      } catch (error) {
        playerCreatedRef.current = false;
        setPlayerError(error instanceof Error ? error.message : 'Unable to initialize the YouTube player.');
      }
    };

    const requestPlayer = () => {
      loadYouTubeApi().then((api) => {
        if (disposed) return;
        apiRef.current = api;
        createPlayer(api);
      }).catch((error: unknown) => {
        if (!disposed) setPlayerError(error instanceof Error ? error.message : 'Unable to load the YouTube player.');
      });
    };

    const apiObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        apiObserver.unobserve(section);
        requestPlayer();
      }
    }, { rootMargin: '500px 0px', threshold: 0 });
    apiObserver.observe(section);

    const playbackObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const isVisible = entry.intersectionRatio >= 0.5;
        sectionVisibleRef.current = isVisible;
        const player = playerRef.current;
        const api = apiRef.current;
        if (!isVisible) {
          resumeOnReturnRef.current = Boolean(player && api && isPlayingRef.current);
          if (resumeOnReturnRef.current) player?.pauseVideo();
          return;
        }
        if (!apiRef.current || !playerCreatedRef.current) requestPlayer();
        if (resumeOnReturnRef.current && playerReadyRef.current) {
          resumeOnReturnRef.current = false;
          playerRef.current?.playVideo();
        } else if (!hasStartedRef.current && playerReadyRef.current) {
          hasStartedRef.current = true;
          playerRef.current?.playVideo();
        }
      });
    }, { threshold: 0.5 });
    playbackObserver.observe(section);

    return () => {
      disposed = true;
      apiObserver.disconnect();
      playbackObserver.disconnect();
      stopProgress();
      window.clearTimeout(switchTimerRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      isPlayingRef.current = false;
      playerReadyRef.current = false;
      playerCreatedRef.current = false;
    };
  }, [startProgress, stopProgress]);

  function handleQueueKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % videos.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + videos.length) % videos.length;
    if (nextIndex === null) return;
    event.preventDefault();
    sectionRef.current?.querySelector<HTMLButtonElement>(`[data-video-index="${nextIndex}"]`)?.focus();
  }

  function togglePlayback() {
    const player = playerRef.current;
    if (!player || !playerReadyRef.current) return;
    if (isPlayingRef.current) player.pauseVideo();
    else player.playVideo();
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player || !playerReadyRef.current) return;
    if (isMuted) {
      player.unMute();
      player.setVolume(100);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  }

  return (
    <section className="section videos" id="videos" aria-labelledby="videos-heading" ref={sectionRef}>
      <div className="container">
        <div className="video-heading-row reveal">
          <div>
            <span className="eyebrow video-eyebrow">From our doctors</span>
            <h2 id="videos-heading">
              <span className="video-heading-word"><span>Health,</span></span>{' '}
              <span className="video-heading-word"><span>in</span></span>{' '}
              <em><span className="video-heading-word"><span>conversation.</span></span></em>
            </h2>
          </div>
          <a className="button button-ghost" href={youtubeChannel} target="_blank" rel="noopener noreferrer" data-testid="link-visit-youtube-channel">
            Visit our channel <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="videos-content-grid">
          <div className="video-main-column">
            <div className="video-player reveal" data-testid="player-current-video" aria-labelledby="video-main-title">
              <div className={`video-frame${isSwitching ? ' is-switching' : ''}`} ref={videoFrameRef}>
                <div className="youtube-player-mount" ref={playerMountRef} title={activeVideo.title} />
                {playerError && <p className="video-error" role="status">{playerError}</p>}
              </div>
              <div className="video-control-row" aria-label="Video controls">
                <button className="video-control" type="button" onClick={togglePlayback} disabled={!isPlayerReady} aria-label={isPlaying ? 'Pause video' : 'Play video'}>
                  {isPlaying ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
                </button>
                <button className="video-control" type="button" onClick={toggleMute} disabled={!isPlayerReady} aria-label={isMuted ? 'Unmute video' : 'Mute video'}>
                  {isMuted ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
                </button>
                {isMuted && <span className="video-mute-hint">Tap to unmute</span>}
                <div className="video-progress-group">
                  <div className="video-progress" ref={progressBarRef} role="progressbar" aria-label="Video progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
                    <span ref={progressFillRef} />
                  </div>
                  <span className="video-time"><span ref={currentTimeRef}>00:00</span> / <span ref={totalTimeRef}>00:00</span></span>
                </div>
              </div>
              <div className={`video-details${isSwitching ? ' is-switching' : ''}`} aria-live="polite">
                {isPlayerReady && !isPlaying && <span className="video-playing-status">Paused</span>}
                <h3 id="video-main-title">{activeVideo.title}</h3>
                <a href={`https://www.youtube.com/watch?v=${activeVideo.id}`} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube <ArrowRight size={15} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          <aside className="video-queue reveal" aria-label="Up next videos">
            <div className="video-queue-heading">
              <span className="eyebrow">Up next</span>
            </div>
            <div
              className="video-queue-items"
              style={{
                '--queue-active-index': activeIndex,
                '--queue-active-y': `${activeIndex * 68}px`,
                '--queue-active-mobile-y': `${activeIndex * 68}px`,
                '--queue-active-x': `calc(${activeIndex * 100}% + ${activeIndex * 12}px)`,
              } as React.CSSProperties}
            >
              {videos.map((video, index) => {
                const isCurrent = index === activeIndex;
                const number = `0${index + 1}`;
                const accessibleName = `Play video ${number}: ${video.title}`;
                return (
                  <button
                    key={video.id}
                    className={`video-queue-item${isCurrent ? ' is-current' : ''}`}
                    type="button"
                    aria-label={accessibleName}
                    aria-current={isCurrent ? 'true' : undefined}
                    aria-pressed={isCurrent}
                    data-video-index={index}
                    data-testid={`button-video-queue-${video.id}`}
                    onClick={() => selectVideo(index)}
                    onKeyDown={(event) => handleQueueKeyDown(event, index)}
                    style={{ '--queue-index': index } as React.CSSProperties}
                  >
                    {isCurrent && <span className={`video-equalizer${isPlaying ? ' is-playing' : ''}`} aria-hidden="true"><i /><i /><i /></span>}
                    {!isCurrent && <span className="video-queue-number">{number}</span>}
                    <span className="video-queue-title">{video.title}</span>
                    {isCurrent && <span className="video-queue-state">Now playing</span>}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
