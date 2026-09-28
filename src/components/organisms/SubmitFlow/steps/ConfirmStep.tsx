import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Format, Prompt, UserType } from '../submitFlow.types';
import './confirmStep.css';

export interface ConfirmStepProps {
    prompt: Prompt;
    format: Format;
    userType: UserType;
    location: string | null;
    text: string;
    file: File | null;
    onConfirm: () => void;
    onBack: () => void;
    submitting: boolean;
    error?: string | null;
}

const FORMAT_LABELS: Record<Format, string> = {
    text: 'TEXT',
    voice: 'VOICE MEMO',
    image: 'IMAGE',
    video: 'VIDEO',
};

const ConfirmStep = ({
                         prompt,
                         format,
                         userType,
                         location,
                         text,
                         file,
                         onConfirm,
                         onBack,
                         submitting,
                         error,
                     }: ConfirmStepProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [audioDuration, setAudioDuration] = useState(0);

    // Create a blob URL for voice/image preview. Revoked on unmount.
    useEffect(() => {
        if (file && (format === 'voice' || format === 'image')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file, format]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.confirm-step__element',
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.55, stagger: 0.09, ease: 'power3.out' }
            );
        }, rootRef);
        return () => ctx.revert();
    }, []);

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="submit-flow__screen" ref={rootRef}>
            <h1 className="submit-flow__title confirm-step__element">CONFIRM SUBMISSION</h1>

            <div className="confirm-step__card confirm-step__element">
                {/* Meta row */}
                <div className="confirm-step__meta">
                    <span className="confirm-step__badge">{FORMAT_LABELS[format]}</span>
                    {location && (
                        <span className="confirm-step__location">
                            <span className="confirm-step__location-dot" aria-hidden />
                            {location}
                        </span>
                    )}
                    <span className="confirm-step__user-type">{userType}</span>
                </div>

                {/* Prompt echo */}
                <p className="confirm-step__prompt">"{prompt.text}"</p>

                {/* Content preview */}
                <div className="confirm-step__preview">
                    {format === 'text' && (
                        <p className="confirm-step__text-preview">
                            {text.length > 150 ? `${text.slice(0, 150)}\u2026` : text}
                        </p>
                    )}

                    {format === 'voice' && previewUrl && (
                        <div className="confirm-step__voice-preview">
                            {audioDuration > 0 && (
                                <span className="confirm-step__duration">
                                    {formatDuration(audioDuration)}
                                </span>
                            )}
                            <audio
                                ref={audioRef}
                                className="confirm-step__audio"
                                src={previewUrl}
                                controls
                                preload="metadata"
                                onLoadedMetadata={() => {
                                    if (audioRef.current && isFinite(audioRef.current.duration)) {
                                        setAudioDuration(Math.round(audioRef.current.duration));
                                    }
                                }}
                            />
                        </div>
                    )}

                    {format === 'image' && previewUrl && (
                        <img
                            className="confirm-step__img"
                            src={previewUrl}
                            alt="Your image preview"
                        />
                    )}

                    {format === 'video' && file && (
                        <div className="confirm-step__file-info">
                            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                                <rect x="4" y="8" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="2" />
                                <path d="M32 18l12-6v24l-12-6V18z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                            <span className="confirm-step__filename">{file.name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="confirm-step__actions confirm-step__element">
                <button
                    type="button"
                    className="confirm-step__btn confirm-step__btn--back"
                    onClick={onBack}
                    disabled={submitting}
                >
                    ← BACK
                </button>
                <button
                    type="button"
                    className="confirm-step__btn confirm-step__btn--confirm"
                    onClick={onConfirm}
                    disabled={submitting}
                >
                    {submitting ? 'SUBMITTING...' : 'CONFIRM →'}
                </button>
            </div>

            {error && <p className="confirm-step__error confirm-step__element">{error}</p>}
        </div>
    );
};

export default ConfirmStep;