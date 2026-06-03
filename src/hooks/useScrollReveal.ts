import { useRef, useEffect } from 'react';

/**
 * Adds the 'revealed' class to the returned ref element
 * when it enters the viewport. One-shot — disconnects after firing.
 */
const useScrollReveal = (threshold = 0.12) => {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('revealed');
                    observer.disconnect();
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return ref;
};

export default useScrollReveal;
