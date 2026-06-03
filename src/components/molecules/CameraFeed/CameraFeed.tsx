import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import './cameraFeed.css';

interface CameraFeedProps {
    src?:         string;  // video / HLS stream URL
    fallbackSrc?: string;  // fallback image URL
    className?:   string;
}

type Status = 'loading' | 'playing' | 'fallback';

const CameraFeed = ({ src, fallbackSrc, className = '' }: CameraFeedProps) => {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<Status>('loading');

    useEffect(() => {
        if (!src) { setStatus('fallback'); return; }

        const video = videoRef.current;
        if (!video) return;

        // After 3s, if not playing yet, switch to fallback
        const timeout = setTimeout(() => setStatus('fallback'), 3000);

        const onPlaying = () => { clearTimeout(timeout); setStatus('playing'); };
        const onError   = () => { clearTimeout(timeout); setStatus('fallback'); };

        video.addEventListener('playing', onPlaying);
        video.addEventListener('error',   onError);

        return () => {
            clearTimeout(timeout);
            video.removeEventListener('playing', onPlaying);
            video.removeEventListener('error',   onError);
        };
    }, [src]);

    return (
        <div className={`camera-feed ${className}`} aria-live="polite">

            {/* ── Loading state ── */}
            <div className={`camera-feed__loading${status !== 'loading' ? ' camera-feed__loading--out' : ''}`}
                 aria-hidden={status !== 'loading'}>
                <span className="camera-feed__spinner" />
                <span className="camera-feed__loading-label">{t.hero.loading}</span>
            </div>

            {/* ── Video ── */}
            {src && (
                <video
                    ref={videoRef}
                    className={`camera-feed__video${status === 'playing' ? ' camera-feed__video--in' : ''}`}
                    src={src}
                    autoPlay muted loop playsInline
                    aria-label="Live camera feed from Antwerp"
                />
            )}

            {/* ── Fallback ── */}
            {status === 'fallback' && (
                <div className="camera-feed__fallback" role="img" aria-label={t.hero.fallback}>
                    {fallbackSrc
                        ? <img src={fallbackSrc} alt="" className="camera-feed__fallback-img" />
                        : <div className="camera-feed__fallback-pattern">
                            <span className="camera-feed__fallback-text">ANTWERP UNSEEN</span>
                          </div>
                    }
                </div>
            )}
        </div>
    );
};

export default CameraFeed;
