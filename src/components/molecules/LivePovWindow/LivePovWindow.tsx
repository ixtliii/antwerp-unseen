import { useInstallationViewer } from '../../../hooks/useInstallationViewer';
import './livePovWindow.css';

interface LivePovWindowProps {
    placeholderSrc: string;
}

const LivePovWindow = ({ placeholderSrc }: LivePovWindowProps) => {
    const { isLive, location, frame } = useInstallationViewer();
    const showingLive = isLive && frame;

    return (
        <div className="live-pov">
            {showingLive ? (
                <img className="live-pov__media" src={frame} alt="Live installation feed" />
            ) : (
                <video
                    className="live-pov__media"
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