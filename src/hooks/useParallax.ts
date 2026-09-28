import { useRef, useEffect } from 'react';

/**
 * Attaches a mouse-move listener (desktop only) that translates
 * the returned ref element by `strength * 100` px on each axis.
 * No CSS variables needed — transform applied directly.
 */
const useParallax = (strength = 0.025) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Only on pointer devices — avoids motion on mobile/tablet
        const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
        if (!mq.matches) return;

        let rafId = 0;
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;

        const onMove = (e: MouseEvent) => {
            targetX = (e.clientX / window.innerWidth  - 0.5) * strength * 100;
            targetY = (e.clientY / window.innerHeight - 0.5) * strength * 100;
        };

        // Lerp for buttery smoothness
        const tick = () => {
            currentX += (targetX - currentX) * 0.08;
            currentY += (targetY - currentY) * 0.08;
            if (ref.current) {
                ref.current.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
            rafId = requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        rafId = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(rafId);
        };
    }, [strength]);

    return ref;
};

export default useParallax;
