import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import type { Submission } from '../../../types';
import './submissionDetail.css';

interface SubmissionDetailProps {
    submission: Submission;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
    new Date(iso)
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .toUpperCase();

const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

// ── Sub-SVGs ───────────────────────────────────────────────────────────────

const EyeMark = () => (
    <svg className="detail__eye" width="72" height="44" viewBox="0 0 64 40" fill="none">
        <path d="M2 20C2 20 14 4 32 4C50 4 62 20 62 20C62 20 50 36 32 36C14 36 2 20 2 20Z"
              stroke="currentColor" strokeWidth="1.5" />
        <circle cx="32" cy="20" r="8" fill="currentColor" />
        <circle cx="32" cy="20" r="3.5" fill="var(--bg-dark,#080808)" />
    </svg>
);

const ExpandIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
);

// ── SubmissionDetail ───────────────────────────────────────────────────────

const SubmissionDetail = ({
                              submission,
                              onClose,
                              onPrev,
                              onNext,
                              hasPrev,
                              hasNext,
                          }: SubmissionDetailProps) => {
    const navigate        = useNavigate();
    const rootRef         = useRef<HTMLDivElement>(null);
    const videoRef        = useRef<HTMLVideoElement>(null);
    const audioRef        = useRef<HTMLAudioElement>(null);
    const rafRef          = useRef<number>(0);
    const animRafRef      = useRef<number>(0);
    // Track whether this is the very first open so we play the full reveal
    // on open but only a content-fade on navigation between submissions.
    const isFirstOpenRef  = useRef(true);

    const [playing,  setPlaying]  = useState(false);
    const [progress, setProgress] = useState(0);
    const [elapsed,  setElapsed]  = useState(0);
    const [duration, setDuration] = useState(0);

    const { format, file_url, content_text, location, user_type, prompt_text, created_at } = submission;
    const dateStr = fmtDate(created_at);

    // ── Hide global nav while detail is open ──────────────────────────────
    useEffect(() => {
        document.body.classList.add('is-immersive');
        return () => {
            document.body.classList.remove('is-immersive');
        };
    }, []);

    // ── Entry animation ───────────────────────────────────────────────────
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;

        // requestAnimationFrame ensures React has finished painting the DOM
        animRafRef.current = requestAnimationFrame(() => {
            const top    = el.querySelector('.detail__top')    as HTMLElement | null;
            const bottom = el.querySelector('.detail__bottom') as HTMLElement | null;
            const bg     = el.querySelector('.detail__bg')     as HTMLElement | null;

            if (isFirstOpenRef.current) {
                // ── Circular reveal: card flies open into full screen ──────
                isFirstOpenRef.current = false;

                gsap.killTweensOf(el);
                gsap.set(el, { clipPath: 'circle(0% at 45% 55%)', opacity: 1 });
                gsap.to(el, {
                    clipPath: 'circle(150% at 45% 55%)',
                    duration: 1.1,
                    ease: 'expo.out',
                });

                if (top) {
                    gsap.set(top, { y: -14, opacity: 0 });
                    gsap.to(top, { y: 0, opacity: 1, duration: 0.5, delay: 0.35, ease: 'power3.out' });
                }
                if (bottom) {
                    gsap.set(bottom, { y: 14, opacity: 0 });
                    gsap.to(bottom, { y: 0, opacity: 1, duration: 0.5, delay: 0.35, ease: 'power3.out' });
                }
            } else {
                // ── Quick content crossfade on prev/next navigation ───────
                if (bg) {
                    gsap.set(bg, { opacity: 0 });
                    gsap.to(bg, { opacity: 1, duration: 0.28, ease: 'power2.out' });
                }
            }
        });

        return () => cancelAnimationFrame(animRafRef.current);
    }, [submission.id]);

    // ── Reset media on submission change ─────────────────────────────────
    useEffect(() => {
        cancelAnimationFrame(rafRef.current);
        videoRef.current?.pause();
        audioRef.current?.pause();
        setPlaying(false);
        setProgress(0);
        setElapsed(0);
        setDuration(0);
    }, [submission.id]);

    // ── Keyboard ──────────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape')                    handleClose();
            if (e.key === 'ArrowLeft'  && hasPrev)     onPrev();
            if (e.key === 'ArrowRight' && hasNext)     onNext();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasPrev, hasNext]);

    // ── Close — circle collapses back to card position ────────────────────
    const handleClose = () => {
        cancelAnimationFrame(rafRef.current);
        cancelAnimationFrame(animRafRef.current);
        const el = rootRef.current;
        if (!el) { onClose(); return; }
        gsap.killTweensOf(el);
        gsap.to(el, {
            clipPath: 'circle(0% at 45% 55%)',
            duration: 0.45,
            ease: 'power3.in',
            onComplete: onClose,
        });
    };

    // ── Media playback ────────────────────────────────────────────────────
    const tick = useCallback(() => {
        const media = format === 'video' ? videoRef.current : audioRef.current;
        if (!media) return;
        setProgress(media.duration ? media.currentTime / media.duration : 0);
        if (format === 'voice') setElapsed(media.currentTime);
        rafRef.current = requestAnimationFrame(tick);
    }, [format]);

    const toggleMedia = () => {
        const media = format === 'video' ? videoRef.current : audioRef.current;
        if (!media) return;
        if (media.paused) {
            void media.play();
            setPlaying(true);
            rafRef.current = requestAnimationFrame(tick);
        } else {
            media.pause();
            setPlaying(false);
            cancelAnimationFrame(rafRef.current);
        }
    };

    const seekMedia = (e: React.MouseEvent<HTMLElement>) => {
        const media = format === 'video' ? videoRef.current : audioRef.current;
        if (!media?.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        media.currentTime = ((e.clientX - rect.left) / rect.width) * media.duration;
    };

    const onMediaEnded = () => {
        setPlaying(false);
        setProgress(0);
        setElapsed(0);
        cancelAnimationFrame(rafRef.current);
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="submission-detail" ref={rootRef}>

            {/* ── Full-bleed background ── */}
            <div className="detail__bg">
                {format === 'image' && file_url && (
                    <img src={file_url} alt="" className="detail__bg-image" draggable={false} />
                )}

                {format === 'video' && file_url && (
                    <video
                        ref={videoRef}
                        src={file_url}
                        className="detail__bg-video"
                        preload="auto"
                        playsInline
                        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
                        onEnded={onMediaEnded}
                    />
                )}

                {(format === 'text' || format === 'voice') && (
                    <div className="detail__bg-dark" aria-hidden />
                )}

                {(format === 'image' || format === 'video') && (
                    <>
                        <div className="detail__veil detail__veil--top"    aria-hidden />
                        <div className="detail__veil detail__veil--bottom" aria-hidden />
                    </>
                )}
            </div>

            {/* ── UI overlay ── */}
            <div className="detail__overlay">

                {/* Top bar */}
                <header className="detail__top">
                    <button className="detail__back" onClick={handleClose} aria-label="Close">
                        ←
                        <span className="detail__back-line" aria-hidden>——</span>
                    </button>

                    <div className="detail__chips">
                        <span className="detail__chip detail__chip--type">{user_type}</span>
                        {location && (
                            <span className="detail__chip">
                                <span className="detail__chip-dot" aria-hidden />
                                {location}
                            </span>
                        )}
                        <span className="detail__chip detail__chip--date">{dateStr}</span>
                    </div>

                    <button className="detail__expand" aria-label="Expand / fullscreen">
                        <ExpandIcon />
                    </button>
                </header>

                {/* Center */}
                <main className="detail__center">

                    {format === 'text' && (
                        <div className="detail__center-content detail__text-content">
                            <EyeMark />
                            <p className="detail__text-body">{content_text}</p>
                            {location && (
                                <span className="detail__location-tag">
                                    <span className="detail__location-dot" aria-hidden />
                                    Somewhere in {location}
                                </span>
                            )}
                        </div>
                    )}

                    {format === 'voice' && (
                        <div className="detail__center-content detail__voice-content">
                            {file_url && (
                                <audio
                                    ref={audioRef}
                                    src={file_url}
                                    preload="metadata"
                                    onLoadedMetadata={() =>
                                        setDuration(audioRef.current?.duration ?? 0)
                                    }
                                    onEnded={onMediaEnded}
                                />
                            )}

                            <button
                                className={`detail__mic ${playing ? 'is-playing' : ''}`}
                                onClick={toggleMedia}
                                aria-label={playing ? 'Pause' : 'Play recording'}
                            >
                                <span className="detail__mic-ring detail__mic-ring--outer" aria-hidden />
                                <span className="detail__mic-ring detail__mic-ring--mid"   aria-hidden />
                                <span className="detail__mic-core" aria-hidden>
                                    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                                        {playing ? (
                                            <>
                                                <rect x="13" y="12" width="8" height="24" rx="2" fill="currentColor" />
                                                <rect x="27" y="12" width="8" height="24" rx="2" fill="currentColor" />
                                            </>
                                        ) : (
                                            <>
                                                <rect x="17" y="4" width="14" height="24" rx="7" fill="currentColor" />
                                                <path d="M8 26c0 8.837 7.163 16 16 16s16-7.163 16-16"
                                                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                                <line x1="24" y1="42" x2="24" y2="48"
                                                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                            </>
                                        )}
                                    </svg>
                                </span>
                            </button>

                            <div className="detail__voice-progress" onClick={seekMedia} role="slider">
                                <div className="detail__voice-track">
                                    <div className="detail__voice-fill" style={{ width: `${progress * 100}%` }} />
                                </div>
                                <div className="detail__voice-times">
                                    <span>{fmtTime(elapsed)}</span>
                                    <span>{fmtTime(duration)}</span>
                                </div>
                            </div>

                            {content_text && (
                                <p className="detail__voice-text">"{content_text}"</p>
                            )}
                        </div>
                    )}

                    {format === 'video' && (
                        <button
                            className={`detail__video-play ${playing ? 'is-hidden' : ''}`}
                            onClick={toggleMedia}
                            aria-label={playing ? 'Pause' : 'Play video'}
                        >
                            <svg width="50" height="50" viewBox="0 0 48 48" fill="none">
                                <polygon points="14,8 40,24 14,40" fill="currentColor" />
                            </svg>
                        </button>
                    )}
                </main>

                {/* Bottom bar */}
                <footer className="detail__bottom">
                    {/* Video progress spans all columns */}
                    {format === 'video' && (
                        <div className="detail__video-bar" onClick={seekMedia} role="slider">
                            <div className="detail__video-fill" style={{ width: `${progress * 100}%` }} />
                        </div>
                    )}

                    <div className="detail__prompt">
                        <span className="detail__prompt-q">Q:</span>
                        <p className="detail__prompt-text">"{prompt_text}"</p>
                    </div>

                    <button
                        className="detail__cta"
                        onClick={() => {
                            handleClose();
                            setTimeout(() => navigate('/submit'), 480);
                        }}
                    >
                        ADD YOUR STORY
                    </button>

                    <div className="detail__nav">
                        <button
                            className="detail__nav-btn"
                            onClick={onPrev}
                            disabled={!hasPrev}
                            aria-label="Previous"
                        >
                            ←
                        </button>
                        {/* Green class applied only when actually active — no pseudo-class needed */}
                        <button
                            className={`detail__nav-btn${hasNext ? ' detail__nav-btn--next' : ''}`}
                            onClick={onNext}
                            disabled={!hasNext}
                            aria-label="Next"
                        >
                            →
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SubmissionDetail;