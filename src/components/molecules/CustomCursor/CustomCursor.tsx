import { useEffect, useRef, useState } from 'react';
import './customCursor.css';

const CustomCursor = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }

            const target = e.target as HTMLElement;
            const isClickable = target.closest('a, button, [role="button"], input, select, textarea');
            setIsHovered(!!isClickable);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div ref={cursorRef} className="global-custom-cursor-wrapper">
            <div className={`global-custom-cursor ${isHovered ? 'hovered' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                </svg>
            </div>
        </div>
    );
};

export default CustomCursor;