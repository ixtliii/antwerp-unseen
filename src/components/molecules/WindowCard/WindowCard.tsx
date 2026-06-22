import { forwardRef } from 'react';
import type { WindowMemory } from '../../../types';
import DitherVideo from '../../atoms/DitherVideo/DitherVideo';
import './windowCard.css';

interface WindowCardProps {
    memory: WindowMemory;
    isCenter: boolean;
    onSelect: () => void;
}

// isCenter is part of the public props (the carousel passes it) but isn't used
// for rendering yet — omitted from the destructure so the build stays clean.
const WindowCard = forwardRef<HTMLButtonElement, WindowCardProps>(
    ({ memory, onSelect }, ref) => (
        <button ref={ref} type="button" className="window-card" onClick={onSelect} aria-label={memory.location}>
            <span className="window-card__inner">
                <DitherVideo
                    src={memory.videoSrc}
                    pixelSize={3}
                    intensity={0.9}
                    playbackRate={0.6}
                    className="window-card__media"
                />
            </span>
        </button>
    )
);

WindowCard.displayName = 'WindowCard';
export default WindowCard;