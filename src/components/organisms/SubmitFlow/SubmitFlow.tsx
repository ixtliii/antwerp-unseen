import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { moderateText } from '../../../lib/moderation';
import { triggerPageTransition } from '../../globals/PixelTransition/triggerTransition';
import BackButton from '../../atoms/BackButton/BackButton';
import PromptStep from './steps/PromptStep';
import FormatStep from './steps/FormatStep';
import TextStep from './steps/TextStep';
import VoiceStep from './steps/VoiceStep';
import MediaStep from './steps/MediaStep';
import ConfirmStep from './steps/ConfirmStep';
import SuccessStep from './steps/SuccessStep';
import type { Step, Format, UserType, Prompt } from './submitFlow.types';
import { PROMPTS } from './submitFlow.types';
import './submitFlow.css';

const SubmitFlow = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const locationParam = searchParams.get('location');
    const promptParam   = searchParams.get('prompt');

    // Arriving from an installation QR (?prompt=N): resolve the prompt once,
    // before first render, so we start on the right step with no flicker and
    // no setState-in-effect cascade.
    const seededPrompt = promptParam
        ? PROMPTS.find((p) => p.id === Number(promptParam)) ?? null
        : null;

    const [step, setStep]         = useState<Step>(seededPrompt ? 'format' : 'prompt');
    const [prompt, setPrompt]     = useState<Prompt | null>(seededPrompt);
    const [format, setFormat]     = useState<Format | null>(null);
    const [text, setText]         = useState('');
    const [userType, setUserType] = useState<UserType>('local');
    const [file, setFile]         = useState<File | null>(null);
    const [submitting, setSubmitting]   = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // ── Clear any entered content (used when switching format) ───────────────
    const clearInput = () => {
        setFile(null);
        setText('');
        setSubmitError(null);
    };

    // Switch format in place on the input step — discards what was entered.
    const switchFormat = (next: Format) => {
        if (next === format) return;
        clearInput();
        setFormat(next);
    };

    // ── Navigation ──────────────────────────────────────────────────────────

    const goBack = () => {
        if (step === 'confirm') {
            setStep('input');
        } else if (step === 'input') {
            clearInput();
            setFormat(null);
            setStep('format');
        } else if (step === 'format') {
            setPrompt(null);
            setStep('prompt');
        }
    };

    const clearPrompt = () => {
        setPrompt(null);
        setFormat(null);
        setFile(null);
        setText('');
        setStep('prompt');
    };

    const returnToArchive = () => {
        triggerPageTransition(() => navigate('/explore'));
    };

    // ── Submit flow ──────────────────────────────────────────────────────────

    const handleGoToConfirm = () => {
        setSubmitError(null);
        setStep('confirm');
    };

    const handleConfirm = async () => {
        if (!prompt || !format) return;

        // ── Validation: content presence ──────────────────────────────────────
        if (format === 'text' && !text.trim()) {
            setSubmitError('Please write something before submitting.');
            return;
        }
        if ((format === 'voice' || format === 'image' || format === 'video') && !file) {
            setSubmitError('Please add a file before submitting.');
            return;
        }

        // ── Validation: prompt must be a real prompt ──────────────────────────
        if (!PROMPTS.some((p) => p.id === prompt.id)) {
            setSubmitError('Invalid prompt. Please start again.');
            return;
        }

        // ── Validation: file size cap (25 MB) ─────────────────────────────────
        const MAX_BYTES = 25 * 1024 * 1024;
        if (file && file.size > MAX_BYTES) {
            setSubmitError('File is too large. Please keep it under 25 MB.');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        try {
            // ── Moderation: block harmful text before anything is stored ──────
            if (format === 'text') {
                const result = await moderateText(text);
                if (!result.ok) {
                    setSubmitError(
                        "Your submission doesn't meet our community guidelines. Please revise it."
                    );
                    setSubmitting(false);
                    return;
                }
            }

            let fileUrl: string | null = null;
            let fileName: string | null = null;

            if (file && (format === 'voice' || format === 'image' || format === 'video')) {
                const ext = file.name.split('.').pop() ?? 'bin';
                const path = `${format}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from('submissions')
                    .upload(path, file, { upsert: false });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('submissions')
                    .getPublicUrl(path);

                fileUrl = urlData.publicUrl;
                fileName = file.name;
            }

            const { error: insertError } = await supabase.from('submissions').insert({
                location: locationParam,
                prompt_id: prompt.id,
                prompt_text: prompt.text,
                format,
                user_type: userType,
                content_text: format === 'text' ? text.trim() : null,
                file_url: fileUrl,
                file_name: fileName,
            });

            if (insertError) throw insertError;

            setStep('success');
        } catch (err) {
            console.error('Submission failed:', err);
            setSubmitError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="submit-flow">
            {(step === 'format' || step === 'input' || step === 'confirm') && (
                <BackButton onClick={goBack} />
            )}

            {step === 'prompt' && (
                <PromptStep
                    onSelect={(p) => { setPrompt(p); setStep('format'); }}
                />
            )}

            {step === 'format' && prompt && (
                <FormatStep
                    prompt={prompt}
                    onSelectFormat={(f) => { setFormat(f); setStep('input'); }}
                    onClearPrompt={clearPrompt}
                />
            )}

            {step === 'input' && prompt && format === 'text' && (
                <TextStep
                    prompt={prompt}
                    value={text}
                    onChange={setText}
                    userType={userType}
                    onUserTypeChange={setUserType}
                    onSubmit={handleGoToConfirm}
                    submitting={false}
                    activeFormat={format}
                    onSwitchFormat={switchFormat}
                />
            )}

            {step === 'input' && prompt && format === 'voice' && (
                <VoiceStep
                    prompt={prompt}
                    file={file}
                    onFileReady={setFile}
                    userType={userType}
                    onUserTypeChange={setUserType}
                    onSubmit={handleGoToConfirm}
                    submitting={false}
                    activeFormat={format}
                    onSwitchFormat={switchFormat}
                />
            )}

            {step === 'input' && prompt && (format === 'image' || format === 'video') && (
                <MediaStep
                    prompt={prompt}
                    kind={format}
                    file={file}
                    onFileChange={setFile}
                    userType={userType}
                    onUserTypeChange={setUserType}
                    onSubmit={handleGoToConfirm}
                    submitting={false}
                    activeFormat={format}
                    onSwitchFormat={switchFormat}
                />
            )}

            {step === 'confirm' && prompt && format && (
                <ConfirmStep
                    prompt={prompt}
                    format={format}
                    userType={userType}
                    location={locationParam}
                    text={text}
                    file={file}
                    onConfirm={handleConfirm}
                    onBack={goBack}
                    submitting={submitting}
                    error={submitError}
                />
            )}

            {step === 'success' && <SuccessStep onReturn={returnToArchive} />}

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