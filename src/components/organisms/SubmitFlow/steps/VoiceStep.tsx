import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Prompt, UserType } from '../submitFlow.types';
import SubmitFooter from '../../../molecules/SubmitFooter/SubmitFooter';

interface VoiceStepProps {
    prompt: Prompt;
    file: File | null;
    onFileReady: (file: File) => void;
    userType: UserType;
    onUserTypeChange: (type: UserType) => void;
    onSubmit: () => void;
    submitting: boolean;
}

const VoiceStep = ({ prompt, file, onFileReady, userType, onUserTypeChange, onSubmit, submitting }: VoiceStepProps) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    // Tracks the object URL we own so we can revoke it on change / unmount
    const ownedUrlRef = useRef<string | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioDuration, setAudioDuration] = useState(0);

    // If we're returning from the confirm step the parent file is already set but
    // we have no local audioUrl — recreate it from the file so playback works.
    useEffect(() => {
        if (file && !audioUrl) {
            const url = URL.createObjectURL(file);
            ownedUrlRef.current = url;
            setAudioUrl(url);
        }
        // Intentionally only on mount — ESLint disable is correct here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Clean up any owned blob URL when the component unmounts.
    useEffect(() => {
        return () => {
            if (ownedUrlRef.current) URL.revokeObjectURL(ownedUrlRef.current);
        };
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo('.submit-flow__title', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 })
                .fromTo('.submit-flow__prompt-echo', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.3')
                .fromTo('.voice-step__ring', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.2')
                .fromTo('.voice-step__record', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');

            gsap.to('.voice-step__ring-outer', {
                scale: 1.08,
                opacity: 0.4,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, rootRef);
        return () => ctx.revert();
    }, []);

    const setNewUrl = (url: string | null) => {
        if (ownedUrlRef.current) URL.revokeObjectURL(ownedUrlRef.current);
        ownedUrlRef.current = url;
        setAudioUrl(url);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            recorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setNewUrl(url);
                setAudioDuration(0); // will be set by onLoadedMetadata
                onFileReady(new File([blob], 'voice-memo.webm', { type: 'audio/webm' }));
                stream.getTracks().forEach((t) => t.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch {
            console.error('Microphone access denied');
        }
    };

    const stopRecording = () => {
        recorderRef.current?.stop();
        setIsRecording(false);
    };

    const handleReRecord = () => {
        setNewUrl(null);
        setAudioDuration(0);
        // Parent `file` stays stale until a new recording completes —
        // that's fine because the submit footer only appears when audioUrl is set.
    };

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="submit-flow__screen" ref={rootRef}>
            <h1 className="submit-flow__title">ADD YOUR STORY</h1>
            <p className="submit-flow__prompt-echo">"{prompt.text}"</p>

            <div className="voice-step">
                <div className={`voice-step__ring ${isRecording ? 'is-recording' : ''}`}>
                    <div className="voice-step__ring-outer" />
                    <div className="voice-step__ring-mid" />
                    <div className="voice-step__ring-inner">
                        <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
                            <rect x="17" y="4" width="14" height="24" rx="7" fill="currentColor" />
                            <path d="M8 26c0 8.837 7.163 16 16 16s16-7.163 16-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="24" y1="42" x2="24" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                {/* Idle: no recording yet */}
                {!audioUrl && !isRecording && (
                    <button type="button" className="voice-step__record" onClick={startRecording}>
                        START RECORDING
                    </button>
                )}

                {/* Active recording */}
                {isRecording && (
                    <button type="button" className="voice-step__record voice-step__record--stop" onClick={stopRecording}>
                        STOP RECORDING
                    </button>
                )}

                {/* Playback after recording */}
                {audioUrl && !isRecording && (
                    <div className="voice-step__playback">
                        {audioDuration > 0 && (
                            <span className="voice-step__duration">{formatDuration(audioDuration)}</span>
                        )}
                        <audio
                            ref={audioRef}
                            className="voice-step__audio"
                            src={audioUrl}
                            controls
                            preload="metadata"
                            onLoadedMetadata={() => {
                                if (audioRef.current && isFinite(audioRef.current.duration)) {
                                    setAudioDuration(Math.round(audioRef.current.duration));
                                }
                            }}
                        />
                        <button type="button" className="voice-step__rerecord" onClick={handleReRecord}>
                            ↺ Re-record
                        </button>
                        <SubmitFooter
                            userType={userType}
                            onUserTypeChange={onUserTypeChange}
                            onSubmit={onSubmit}
                            submitting={submitting}
                            fullWidth
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceStep;