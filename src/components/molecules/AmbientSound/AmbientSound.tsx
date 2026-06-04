import { useState, useRef, useEffect } from 'react';
import ambientSrc from '../../../assets/ambient.mp3';
import './ambientSound.css';

const AmbientSound = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.15;
        }
    }, []);

    const toggleSound = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(() => {});
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleEnded = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }
    };

    return (
        <>
            <audio
                ref={audioRef}
                src={ambientSrc}
                loop
                onEnded={handleEnded}
            />
            <button
                className={`ambient-toggle ${isPlaying ? 'ambient-toggle--playing' : ''}`}
                onClick={toggleSound}
                aria-label="Toggle ambient sound"
            >
                <span className="ambient-toggle__text">
                    SOUND {isPlaying ? 'ON' : 'OFF'}
                </span>
                <span className="ambient-toggle__indicator" />
            </button>
        </>
    );
};

export default AmbientSound;