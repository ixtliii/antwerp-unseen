import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { triggerPageTransition } from '../../globals/PixelTransition/triggerTransition';
import BackButton from '../../atoms/BackButton/BackButton';
import PromptStep from './steps/PromptStep';
import FormatStep from './steps/FormatStep';
import TextStep from './steps/TextStep';
import VoiceStep from './steps/VoiceStep';
import MediaStep from './steps/MediaStep';
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

    const locationParam = searchParams.get('location');

    const goBack = () => {
        if (step === 'input') {
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

    const handleSubmit = async () => {
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 800));
        setSubmitting(false);
        setStep('success');
    };

    const returnToArchive = () => {
        triggerPageTransition(() => navigate('/explore'));
    };

    return (
        <div className="submit-flow">
            {(step === 'format' || step === 'input') && <BackButton onClick={goBack} />}

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
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}

            {step === 'input' && prompt && format === 'voice' && (
                <VoiceStep
                    prompt={prompt}
                    file={file}
                    onFileReady={setFile}
                    userType={userType}
                    onUserTypeChange={setUserType}
                    onSubmit={handleSubmit}
                    submitting={submitting}
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
                    onSubmit={handleSubmit}
                    submitting={submitting}
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