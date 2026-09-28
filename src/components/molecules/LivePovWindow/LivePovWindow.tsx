import { useEffect, useRef } from 'react';
import { useInstallationViewer } from '../../../hooks/useInstallationViewer';
import './livePovWindow.css';

interface LivePovWindowProps {
    placeholderSrc: string;
    active?: boolean;
}

const LivePovWindow = ({ placeholderSrc, active = true }: LivePovWindowProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isLive, location, frame } = useInstallationViewer();
    const showingLive = isLive && frame;

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (active) v.play().catch(() => {});
        else v.pause();
    }, [active, showingLive]);

    return (
        <div className="live-pov">
            {showingLive ? (
                <img className="live-pov__media" src={frame} alt="Live installation feed" />
            ) : (
                <video
                    ref={videoRef}
                    className="live-pov__media"
                    src={placeholderSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                />
            )}

            <div className={`live-pov__badge ${showingLive ? 'is-live' : ''}`}>
                <span className="live-pov__dot" />
                {showingLive ? (
                    <span>LIVE{location ? ` · ${location.toUpperCase()}` : ''}</span>
                ) : (
                    <span>OFFLINE</span>
                )}
            </div>
        </div>
    );
};

export default LivePovWindow;