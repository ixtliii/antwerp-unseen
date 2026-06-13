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
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);

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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            recorderRef.current = recorder;
            chunksRef.current = [];
            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
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

                {file ? (
                    <div className="voice-step__done">
                        <p className="voice-step__done-label">Recording saved</p>
                        <SubmitFooter
                            userType={userType}
                            onUserTypeChange={onUserTypeChange}
                            onSubmit={onSubmit}
                            submitting={submitting}
                            fullWidth
                        />
                    </div>
                ) : (
                    <button
                        type="button"
                        className="voice-step__record"
                        onClick={isRecording ? stopRecording : startRecording}
                    >
                        {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VoiceStep;