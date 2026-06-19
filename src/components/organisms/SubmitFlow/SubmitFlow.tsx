import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
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
import './submitFlow.css';

const SubmitFlow = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [step, setStep] = useState<Step>('prompt');
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [format, setFormat] = useState<Format | null>(null);
    const [text, setText] = useState('');
    const [userType, setUserType] = useState<UserType>('local');
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const locationParam = searchParams.get('location');

    // ── Navigation ──────────────────────────────────────────────────────────

    const goBack = () => {
        if (step === 'confirm') {
            setStep('input');
        } else if (step === 'input') {
            setFile(null);
            setText('');
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

    // Step 1: called by all input step footers — no Supabase yet, just go to confirm.
    const handleGoToConfirm = () => {
        setSubmitError(null);
        setStep('confirm');
    };

    // Step 2: called by ConfirmStep — actually uploads + inserts.
    const handleConfirm = async () => {
        if (!prompt || !format) return;

        setSubmitting(true);
        setSubmitError(null);

        try {
            let fileUrl: string | null = null;
            let fileName: string | null = null;

            // Upload file to Supabase Storage for voice / image / video formats.
            if (file && (format === 'voice' || format === 'image' || format === 'video')) {
                const ext = file.name.split('.').pop() ?? 'bin';
                // Randomise path so concurrent submissions never collide.
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

            // Insert the row.
            const { error: insertError } = await supabase.from('submissions').insert({
                location: locationParam,
                prompt_id: prompt.id,
                prompt_text: prompt.text,
                format,
                user_type: userType,
                content_text: format === 'text' ? text : null,
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