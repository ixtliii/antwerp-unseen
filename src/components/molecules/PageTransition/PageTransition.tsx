import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './pageTransition.css';

const PageTransition = () => {
    const location = useLocation();
    const [isTransitioning, setIsTransitioning] = useState(false);

    const [delays] = useState(() => {
        const totalPixels = 600;
        const arr = Array.from({ length: totalPixels }).map((_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.map((val) => (val * 0.002).toFixed(3));
    });

    useEffect(() => {
        setIsTransitioning(true);

        const timer = setTimeout(() => {
            setIsTransitioning(false);
        }, 50);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div
            className="page-transition"
            aria-hidden="true"
            style={{ pointerEvents: isTransitioning ? 'auto' : 'none' }}
        >
            {delays.map((delay, i) => (
                <div
                    key={i}
                    className={`page-transition__pixel ${!isTransitioning ? 'page-transition__pixel--revealed' : ''}`}
                    style={{ transitionDelay: `${!isTransitioning ? delay : 0}s` }}
                />
            ))}
        </div>
    );
};

export default PageTransition;