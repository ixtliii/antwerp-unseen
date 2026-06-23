import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { WINDOWS } from '../../../data/windows';
import WindowCard from '../../molecules/WindowCard/WindowCard';
import './windowCarousel.css';

interface WindowCarouselProps {
    current: number;
    onGoTo: (index: number) => void;
    onOpen: (index: number) => void;
}

const WindowCarousel = ({ current, onGoTo, onOpen }: WindowCarouselProps) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const count = WINDOWS.length;
    const anglePer = 360 / count;
    const radiusRef = useRef(600);

    const drag = useRef({ active: false, startX: 0, lastX: 0, moved: false, pointerId: -1 });
    const currentRef = useRef(current);
    useEffect(() => { currentRef.current = current; }, [current]);

    useEffect(() => {
        const place = () => {
            const phone = window.matchMedia('(max-width: 48em)').matches;
            const cardW = phone ? Math.min(window.innerWidth * 0.52, 190) : 260;
            const spacing = phone ? 1.9 : 1.5;
            const radius = (cardW / 2) / Math.tan((anglePer / 2) * (Math.PI / 180)) * spacing;
            radiusRef.current = radius;
            cardRefs.current.forEach((el, i) => {
                if (!el) return;
                el.style.transform =
                    `translate(-50%, -50%) rotateY(${i * anglePer}deg) translateZ(${radius}px)`;
            });
        };
        place();
        window.addEventListener('resize', place);
        return () => window.removeEventListener('resize', place);
    }, [anglePer]);

    useEffect(() => {
        gsap.to(trackRef.current, {
            rotateY: -current * anglePer,
            duration: 1,
            ease: 'power3.inOut',
        });
        cardRefs.current.forEach((el, i) => {
            if (!el) return;
            let diff = Math.abs((i - current + count) % count);
            diff = Math.min(diff, count - diff);
            gsap.to(el, {
                opacity: diff === 0 ? 1 : diff === 1 ? 0.45 : 0.12,
                duration: 0.7,
                ease: 'power2.out',
                overwrite: 'auto',
            });
            el.style.pointerEvents = diff > 1 ? 'none' : 'auto';
        });
    }, [current, anglePer, count]);

    // drag / swipe to change windows
    useEffect(() => {
        const surface = trackRef.current?.parentElement; // the viewport
        if (!surface) return;

        const THRESHOLD = 70;
        const TAP_SLOP = 6;
        const LIVE_DEG_PER_PX = 0.18;

        const onDown = (e: PointerEvent) => {
            drag.current = { active: true, startX: e.clientX, lastX: e.clientX, moved: false, pointerId: e.pointerId };
            gsap.killTweensOf(trackRef.current);
        };

        const onMove = (e: PointerEvent) => {
            if (!drag.current.active) return;
            const dx = e.clientX - drag.current.startX;
            if (Math.abs(dx) > TAP_SLOP) drag.current.moved = true;
            drag.current.lastX = e.clientX;
            const base = -currentRef.current * anglePer;
            gsap.set(trackRef.current, { rotateY: base + dx * LIVE_DEG_PER_PX });
        };

        const finish = (e: PointerEvent) => {
            if (!drag.current.active) return;
            const dx = e.clientX - drag.current.startX;
            drag.current.active = false;

            if (dx <= -THRESHOLD) { onGoTo(currentRef.current + 1); return; }
            if (dx >= THRESHOLD)  { onGoTo(currentRef.current - 1); return; }

            // it was a tap (or a too-small drag) — settle, then resolve the tap target
            if (!drag.current.moved) {
                const card = (e.target as HTMLElement)?.closest('.window-card') as HTMLElement | null;
                if (card) {
                    const i = cardRefs.current.findIndex((el) => el === card);
                    if (i !== -1) {
                        if (i === currentRef.current) onOpen(i);
                        else onGoTo(i);
                        return;
                    }
                }
            }
            // snap back if nothing resolved
            gsap.to(trackRef.current, { rotateY: -currentRef.current * anglePer, duration: 0.5, ease: 'power3.out' });
        };

        surface.addEventListener('pointerdown', onDown);
        surface.addEventListener('pointermove', onMove);
        surface.addEventListener('pointerup', finish);
        surface.addEventListener('pointercancel', finish);
        return () => {
            surface.removeEventListener('pointerdown', onDown);
            surface.removeEventListener('pointermove', onMove);
            surface.removeEventListener('pointerup', finish);
            surface.removeEventListener('pointercancel', finish);
        };
    }, [anglePer, onGoTo, onOpen]);


    return (
        <div className="window-carousel">
            <div className="window-carousel__viewport">
                <div className="window-carousel__track" ref={trackRef}>
                    {WINDOWS.map((memory, i) => {
                        let diff = Math.abs((i - current + count) % count);
                        diff = Math.min(diff, count - diff);
                        return (
                            <WindowCard
                                key={memory.slug}
                                ref={(el) => { cardRefs.current[i] = el; }}
                                memory={memory}
                                isCenter={i === current}
                                active={diff <= 1}
                                onSelect={() => {  }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WindowCarousel;