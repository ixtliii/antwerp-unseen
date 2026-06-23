import { useEffect, useRef, useState } from 'react';
import './ambientSound.css';

const AmbientSound = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

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

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, []);

    const toggleSound = () => {
        if (!audioRef.current) return;

        if (isMuted) {
            audioRef.current.muted = false;
            setIsMuted(false);
            if (audioRef.current.paused) {
                audioRef.current.play().catch(() => {});
            }
        } else {
            audioRef.current.muted = true;
            setIsMuted(true);
        }
    };

    return (
        <>
            <button
                type="button"
                className={`ambient-toggle ${isPlaying && !isMuted ? 'ambient-toggle--playing' : ''}`}
                onClick={toggleSound}
                aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            >
                <span className="ambient-toggle__indicator" aria-hidden="true" />
                {isMuted ? 'SOUND OFF' : 'SOUND ON'}
            </button>
            <audio
                ref={audioRef}
                src="/ambient.mp3"
                loop
                preload="auto"
            />
        </>
    );
};

export default AmbientSound;