import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { WindowMemory } from '../../../types';
import DitherVideo from '../../atoms/DitherVideo/DitherVideo';
import EffectToggle from '../../atoms/EffectToggle/EffectToggle';
import './windowExpanded.css';

interface WindowExpandedProps {
    memory: WindowMemory;
    ditherOn: boolean;
    onToggleDither: (on: boolean) => void;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
}

const WindowExpanded = ({ memory, ditherOn, onToggleDither, onClose, onPrev, onNext }: WindowExpandedProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const touchX = useRef<number | null>(null);

    useEffect(() => {
        gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, onPrev, onNext]);

    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 60) (dx < 0 ? onNext : onPrev)();
        touchX.current = null;
    };

    useEffect(() => {
        document.body.classList.add('is-immersive');
        return () => document.body.classList.remove('is-immersive');
    }, []);
    useEffect(() => {
        document.body.classList.toggle('dither-active', ditherOn);
        return () => document.body.classList.remove('dither-active');
    }, [ditherOn]);
    return (
        <div className="window-expanded" ref={rootRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="window-expanded__media">
                {ditherOn ? (
                    <DitherVideo key={`${memory.slug}-d`} src={memory.videoSrc} pixelSize={2} intensity={1} className="window-expanded__video" />
                ) : (
                    <video key={`${memory.slug}-p`} className="window-expanded__video" src={memory.videoSrc} autoPlay muted loop playsInline />
                )}
            </div>

            <div className="window-expanded__top">
                <button type="button" className="window-expanded__back" onClick={onClose} aria-label="Back">←</button>
                <span className="window-expanded__loc">{memory.location}</span>
            </div>

            <div className="window-expanded__fx">
                <EffectToggle enabled={ditherOn} onChange={onToggleDither} />
            </div>

            <div className="window-expanded__nav">
                <button type="button" className="window-expanded__prev" onClick={onPrev} aria-label="Previous">‹</button>
                <button type="button" className="window-expanded__next" onClick={onNext} aria-label="Next">›</button>
            </div>
        </div>
    );
};

export default WindowExpanded;