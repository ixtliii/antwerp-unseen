import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { triggerPageTransition } from '../../globals/PixelTransition/triggerTransition';
import './submitFlow.css';

type Step = 'prompt' | 'format' | 'input' | 'success';
type Format = 'text' | 'voice' | 'image' | 'video';

const PROMPTS = [
    { id: 1, text: 'When was the last time you felt alive in the city?' },
    { id: 2, text: "What happened here that the street doesn't show anymore?" },
    { id: 3, text: 'What keeps you moving on through here everyday?' },
];

const SubmitFlow = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [step, setStep] = useState<Step>('prompt');
    const [selectedPrompt, setSelectedPrompt] = useState<typeof PROMPTS[0] | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<Format | null>(null);
    const [textValue, setTextValue] = useState('');
    const [userType, setUserType] = useState<'local' | 'tourist'>('local');
    const [file, setFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const locationParam = searchParams.get('location');

    const handlePromptSelect = (prompt: typeof PROMPTS[0]) => {
        setSelectedPrompt(prompt);
        setStep('format');
    };

    const handleFormatSelect = (format: Format) => {
        setSelectedFormat(format);
        setStep('input');
    };

    const handleClearPrompt = () => {
        setSelectedPrompt(null);
        setSelectedFormat(null);
        setFile(null);
        setTextValue('');
        setStep('prompt');
    };

    const handleBack = () => {
        if (step === 'input') {
            setFile(null);
            setTextValue('');
            setIsRecording(false);
            setStep('format');
        } else if (step === 'format') {
            setStep('prompt');
        } else if (step === 'success') {
            setStep('prompt');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) setFile(f);
    };

    const handleDropZoneClick = () => {
        fileInputRef.current?.click();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) setFile(f);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const f = new File([blob], 'voice-memo.webm', { type: 'audio/webm' });
                setFile(f);
                stream.getTracks().forEach((t) => t.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch {
            console.error('Microphone access denied');
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        // TODO: wire to Supabase — upload file, insert row
        await new Promise((r) => setTimeout(r, 800)); // simulate
        setSubmitting(false);
        setStep('success');
    };

    const handleReturnToArchive = () => {
        triggerPageTransition(() => navigate('/explore'));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
    };

    return (
        <div className="submit-flow">
            {/* back arrow */}
            {(step === 'input' || step === 'format') && (
                <button type="button" className="submit-flow__back" onClick={handleBack} aria-label="Go back">
                    ←——
                </button>
            )}

            {/* ── STEP: PROMPT ──────────────────────────── */}
            {step === 'prompt' && (
                <div className="submit-flow__screen">
                    <h1 className="submit-flow__title">ADD YOUR STORY</h1>
                    <p className="submit-flow__subtitle">Pick a prompt that speaks to you</p>

                    <div className="submit-flow__prompts">
                        {PROMPTS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                className="submit-flow__prompt-card"
                                onClick={() => handlePromptSelect(p)}
                            >
                                <span className="submit-flow__prompt-q">Q:</span>
                                <p className="submit-flow__prompt-text">"{p.text}"</p>
                                <span className="submit-flow__prompt-num">{p.id}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── STEP: FORMAT ──────────────────────────── */}
            {step === 'format' && selectedPrompt && (
                <div className="submit-flow__screen">
                    <h1 className="submit-flow__title">ADD YOUR STORY</h1>

                    <div className="submit-flow__selected-prompt">
                        <p>"{selectedPrompt.text}"</p>
                        <button
                            type="button"
                            className="submit-flow__clear-prompt"
                            onClick={handleClearPrompt}
                            aria-label="Clear prompt"
                        >
                            ×
                        </button>
                    </div>

                    <p className="submit-flow__subtitle">How do you want to share it?</p>

                    <div className="submit-flow__formats">
                        <button type="button" className="submit-flow__format-btn" onClick={() => handleFormatSelect('text')}>
                            <span className="submit-flow__format-icon">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <rect x="4" y="4" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
                                    <text x="24" y="32" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" fontFamily="serif">A</text>
                                </svg>
                            </span>
                            <span className="submit-flow__format-label">Text</span>
                            <span className="submit-flow__format-dot" aria-hidden />
                        </button>

                        <button type="button" className="submit-flow__format-btn" onClick={() => handleFormatSelect('voice')}>
                            <span className="submit-flow__format-icon">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <rect x="17" y="4" width="14" height="24" rx="7" stroke="currentColor" strokeWidth="2" />
                                    <path d="M8 26c0 8.837 7.163 16 16 16s16-7.163 16-16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <line x1="24" y1="42" x2="24" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </span>
                            <span className="submit-flow__format-label">Voice</span>
                            <span className="submit-flow__format-dot" aria-hidden />
                        </button>

                        <button type="button" className="submit-flow__format-btn" onClick={() => handleFormatSelect('image')}>
                            <span className="submit-flow__format-icon">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" strokeWidth="2" />
                                    <circle cx="15" cy="19" r="4" stroke="currentColor" strokeWidth="2" />
                                    <path d="M4 34l10-10 8 8 6-6 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                            <span className="submit-flow__format-label">Image</span>
                            <span className="submit-flow__format-dot" aria-hidden />
                        </button>

                        <button type="button" className="submit-flow__format-btn" onClick={() => handleFormatSelect('video')}>
                            <span className="submit-flow__format-icon">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <rect x="4" y="8" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="2" />
                                    <path d="M32 18l12-6v24l-12-6V18z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                </svg>
                            </span>
                            <span className="submit-flow__format-label">Video</span>
                            <span className="submit-flow__format-dot" aria-hidden />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP: INPUT ───────────────────────────── */}
            {step === 'input' && selectedPrompt && (
                <div className="submit-flow__screen">
                    <h1 className="submit-flow__title">ADD YOUR STORY</h1>
                    <p className="submit-flow__selected-prompt-small">"{selectedPrompt.text}"</p>

                    {/* TEXT */}
                    {selectedFormat === 'text' && (
                        <div className="submit-flow__input-area">
                            <textarea
                                className="submit-flow__textarea"
                                placeholder="Add text here..."
                                value={textValue}
                                onChange={(e) => setTextValue(e.target.value)}
                                rows={8}
                            />
                            <div className="submit-flow__footer">
                                <div className="submit-flow__user-type">
                                    <span>I'm an Antwerp :</span>
                                    <button
                                        type="button"
                                        className={`submit-flow__type-btn ${userType === 'local' ? 'is-active' : ''}`}
                                        onClick={() => setUserType('local')}
                                    >
                                        Local
                                    </button>
                                    <button
                                        type="button"
                                        className={`submit-flow__type-btn ${userType === 'tourist' ? 'is-active' : ''}`}
                                        onClick={() => setUserType('tourist')}
                                    >
                                        Tourist
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="submit-flow__submit-btn"
                                    onClick={handleSubmit}
                                    disabled={!textValue.trim() || submitting}
                                >
                                    {submitting ? 'SUBMITTING...' : 'SUBMIT'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* VOICE */}
                    {selectedFormat === 'voice' && (
                        <div className="submit-flow__voice-area">
                            <div className={`submit-flow__mic-ring ${isRecording ? 'is-recording' : ''}`}>
                                <div className="submit-flow__mic-ring-outer" />
                                <div className="submit-flow__mic-ring-mid" />
                                <div className="submit-flow__mic-ring-inner">
                                    <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                                        <rect x="17" y="4" width="14" height="24" rx="7" fill="currentColor" />
                                        <path d="M8 26c0 8.837 7.163 16 16 16s16-7.163 16-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="24" y1="42" x2="24" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                            {file ? (
                                <div className="submit-flow__voice-recorded">
                                    <p className="submit-flow__voice-done">Recording saved</p>
                                    <div className="submit-flow__footer submit-flow__footer--voice">
                                        <div className="submit-flow__user-type">
                                            <span>I'm an Antwerp :</span>
                                            <button type="button" className={`submit-flow__type-btn ${userType === 'local' ? 'is-active' : ''}`} onClick={() => setUserType('local')}>Local</button>
                                            <button type="button" className={`submit-flow__type-btn ${userType === 'tourist' ? 'is-active' : ''}`} onClick={() => setUserType('tourist')}>Tourist</button>
                                        </div>
                                        <button type="button" className="submit-flow__submit-btn" onClick={handleSubmit} disabled={submitting}>
                                            {submitting ? 'SUBMITTING...' : 'SUBMIT'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="submit-flow__record-btn"
                                    onClick={isRecording ? stopRecording : startRecording}
                                >
                                    {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* IMAGE / VIDEO */}
                    {(selectedFormat === 'image' || selectedFormat === 'video') && (
                        <div className="submit-flow__input-area">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={selectedFormat === 'image' ? 'image/*' : 'video/*'}
                                onChange={handleFileChange}
                                className="submit-flow__file-input"
                                aria-label={`Upload ${selectedFormat}`}
                            />

                            <div
                                className="submit-flow__dropzone"
                                onClick={handleDropZoneClick}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleDropZoneClick()}
                                aria-label={`Upload ${selectedFormat} file`}
                            >
                                {file ? (
                                    <>
                                        <button
                                            type="button"
                                            className="submit-flow__clear-file"
                                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                            aria-label="Remove file"
                                        >
                                            ×
                                        </button>
                                        <div className="submit-flow__file-preview">
                                            {selectedFormat === 'image' ? (
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
                                            <p className="submit-flow__file-name">{file.name}</p>
                                            <p className="submit-flow__file-size">{formatFileSize(file.size)}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="submit-flow__upload-icon">
                                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                            <path d="M20 28V12M20 12L13 19M20 12L27 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M8 32h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {file && (
                                <div className="submit-flow__footer">
                                    <div className="submit-flow__user-type">
                                        <span>I'm an Antwerp :</span>
                                        <button type="button" className={`submit-flow__type-btn ${userType === 'local' ? 'is-active' : ''}`} onClick={() => setUserType('local')}>Local</button>
                                        <button type="button" className={`submit-flow__type-btn ${userType === 'tourist' ? 'is-active' : ''}`} onClick={() => setUserType('tourist')}>Tourist</button>
                                    </div>
                                    <button type="button" className="submit-flow__submit-btn submit-flow__submit-btn--full" onClick={handleSubmit} disabled={submitting}>
                                        {submitting ? 'SUBMITTING...' : 'SUBMIT'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── STEP: SUCCESS ─────────────────────────── */}
            {step === 'success' && (
                <div className="submit-flow__screen submit-flow__screen--center">
                    <svg className="submit-flow__eye" width="64" height="40" viewBox="0 0 64 40" fill="none">
                        <path d="M2 20C2 20 14 4 32 4C50 4 62 20 62 20C62 20 50 36 32 36C14 36 2 20 2 20Z" stroke="currentColor" strokeWidth="2.5" />
                        <circle cx="32" cy="20" r="8" fill="currentColor" />
                        <circle cx="32" cy="20" r="4" fill="var(--bg-dark, #080808)" />
                    </svg>

                    <h1 className="submit-flow__title">ANSWER SUBMITTED!</h1>
                    <p className="submit-flow__subtitle">Thank you for your participation.</p>

                    <button
                        type="button"
                        className="submit-flow__return-btn"
                        onClick={handleReturnToArchive}
                    >
                        RETURN TO ARCHIVE
                    </button>
                </div>
            )}

            {/* location indicator if came from NFC */}
            {locationParam && step !== 'success' && (
                <div className="submit-flow__location-tag">
                    <span className="submit-flow__location-dot" aria-hidden />
                    {locationParam}
                </div>
            )}
        </div>
    );
};

export default SubmitFlow;