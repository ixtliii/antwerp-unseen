import { useEffect, useRef, useState } from 'react';

const useActiveSection = <T extends HTMLElement>(ids: string[]) => {
    const [activeId, setActiveId] = useState(ids[0] ?? '');
    const refs = useRef<Map<string, T>>(new Map());

    const setRef = (id: string) => (el: T | null) => {
        if (el) refs.current.set(id, el);
        else refs.current.delete(id);
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // pick the entry closest to the viewport center
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible[0]) {
                    const id = visible[0].target.getAttribute('data-section-id');
                    if (id) setActiveId(id);
                }
            },
            {
                // trigger when section crosses the middle of the viewport
                rootMargin: '-45% 0px -45% 0px',
                threshold: 0,
            }
        );

        refs.current.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [ids.join('|')]);

    return { activeId, setRef };
};

export default useActiveSection;