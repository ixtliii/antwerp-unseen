import { forwardRef } from 'react';
import type { WindowMemory } from '../../../types';
import DitherVideo from '../../atoms/DitherVideo/DitherVideo';
import LivePovWindow from '../LivePovWindow/LivePovWindow';
import './windowCard.css';

interface WindowCardProps {
    memory: WindowMemory;
    isCenter: boolean;
    active: boolean;
    onSelect: () => void;
}

const WindowCard = forwardRef<HTMLButtonElement, WindowCardProps>(
    ({ memory, onSelect }, ref) => (
        <button ref={ref} type="button" className="window-card" onClick={onSelect} aria-label={memory.location}>
            <span className="window-card__inner">
                {memory.isLive ? (
                    <LivePovWindow placeholderSrc={memory.videoSrc} />
                ) : (
                    <DitherVideo
                        src={memory.videoSrc}
                        pixelSize={3}
                        intensity={0.9}
                        playbackRate={0.6}
                        className="window-card__media"
                    />
                )}
            </span>
        </button>
    )
);

WindowCard.displayName = 'WindowCard';
export default WindowCard;