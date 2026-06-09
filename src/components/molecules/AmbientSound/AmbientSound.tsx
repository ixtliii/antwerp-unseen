import { useEffect, useRef } from 'react';

const AmbientSound = () => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.2;
        }

        const start = () => {
            audioRef.current?.play().catch((err) => {
                console.warn('ambient play blocked:', err);
            });
        };

        window.addEventListener('start-ambient', start);
        return () => window.removeEventListener('start-ambient', start);
    }, []);

    return (
        <audio
            ref={audioRef}
            src="/ambient.mp3"
            loop
            preload="auto"
        />
    );
};

export default AmbientSound;