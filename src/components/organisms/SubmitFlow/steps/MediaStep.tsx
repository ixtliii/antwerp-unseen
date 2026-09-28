import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Format, Prompt, UserType } from '../submitFlow.types';
import SubmitFooter from '../../../molecules/SubmitFooter/SubmitFooter';
import FormatSwitcher from './FormatSwitcher';

interface MediaStepProps {
    prompt: Prompt;
    kind: 'image' | 'video';
    file: File | null;
    onFileChange: (file: File | null) => void;
    userType: UserType;
    onUserTypeChange: (type: UserType) => void;
    onSubmit: () => void;
    submitting: boolean;
    activeFormat: Format;
    onSwitchFormat: (format: Format) => void;
}

const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
};

const MediaStep = ({ prompt, kind, file, onFileChange, userType, onUserTypeChange, onSubmit, submitting, activeFormat, onSwitchFormat }: MediaStepProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo('.submit-flow__title', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 })
                .fromTo('.submit-flow__prompt-echo', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.3')
                .fromTo('.format-switcher', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
                .fromTo('.media-step__zone', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, '-=0.1');
        }, rootRef);
        return () => ctx.revert();
    }, []);

    const openPicker = () => inputRef.current?.click();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) onFileChange(f);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onFileChange(f);
    };

    return (
        <div className="submit-flow__screen" ref={rootRef}>
            <h1 className="submit-flow__title">ADD YOUR STORY</h1>
            <p className="submit-flow__prompt-echo">"{prompt.text}"</p>

            <FormatSwitcher active={activeFormat} onSwitch={onSwitchFormat} />

            <div className="submit-flow__input-area">
                <input
                    ref={inputRef}
                    type="file"
                    accept={kind === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleChange}
                    className="media-step__input"
                    aria-label={`Upload ${kind}`}
                />

                <div
                    className="media-step__zone"
                    onClick={openPicker}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openPicker()}
                    aria-label={`Upload ${kind} file`}
                >
                    {file ? (
                        <>
                            <button
                                type="button"
                                className="media-step__clear"
                                onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
                                aria-label="Remove file"
                            >
                                ×
                            </button>
                            <div className="media-step__preview">
                                {kind === 'image' ? (
                                    <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                                        <rect x="4" y="8" width="40" height="32" rx="3" fill="#E8813A" />
                                        <circle cx="15" cy="19" r="4" fill="white" opacity="0.7" />
                                        <path d="M4 34l10-10 8 8 6-6 16 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                                        <rect x="6" y="4" width="28" height="40" rx="3" fill="#E8813A" />
                                        <polygon points="20,18 32,24 20,30" fill="white" />
                                    </svg>
                                )}
                                <p className="media-step__name">{file.name}</p>
                                <p className="media-step__size">{formatFileSize(file.size)}</p>
                            </div>
                        </>
                    ) : (
                        <div className="media-step__upload-icon">
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <path d="M20 28V12M20 12L13 19M20 12L27 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 32h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                    )}
                </div>

                {file && (
                    <SubmitFooter
                        userType={userType}
                        onUserTypeChange={onUserTypeChange}
                        onSubmit={onSubmit}
                        submitting={submitting}
                        fullWidth
                    />
                )}
            </div>
        </div>
    );
};

export default MediaStep;