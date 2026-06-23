import { useEffect, useRef } from 'react';
import { useInstallationViewer } from '../../../hooks/useInstallationViewer';
import './livePovWindow.css';

interface LivePovWindowProps {
    placeholderSrc: string;
}

const LivePovWindow = ({ placeholderSrc }: LivePovWindowProps) => {
    const { isLive, location, stream } = useInstallationViewer();
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        if (stream) {
            el.srcObject = stream;
            el.play().catch(() => {});
        } else {
            el.srcObject = null;
        }
    }, [stream]);

    const showingLive = isLive && stream;

    return (
        <div className="live-pov">
            {showingLive ? (
                <video
                    ref={videoRef}
                    className="live-pov__video"
                    autoPlay
                    muted
                    playsInline
                />
            ) : (
                <video
                    className="live-pov__video"
                    src={placeholderSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
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