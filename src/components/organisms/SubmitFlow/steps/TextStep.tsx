import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Format, Prompt, UserType } from '../submitFlow.types';
import SubmitFooter from '../../../molecules/SubmitFooter/SubmitFooter';
import FormatSwitcher from './FormatSwitcher';

interface TextStepProps {
    prompt: Prompt;
    value: string;
    onChange: (value: string) => void;
    userType: UserType;
    onUserTypeChange: (type: UserType) => void;
    onSubmit: () => void;
    submitting: boolean;
    activeFormat: Format;
    onSwitchFormat: (format: Format) => void;
}

const TextStep = ({ prompt, value, onChange, userType, onUserTypeChange, onSubmit, submitting, activeFormat, onSwitchFormat }: TextStepProps) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
            tl.fromTo('.submit-flow__title', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 })
                .fromTo('.submit-flow__prompt-echo', { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.3')
                .fromTo('.format-switcher', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2')
                .fromTo('.text-step__area',
                    { opacity: 0, scale: 0.96, y: 20 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'expo.out' },
                    '-=0.2'
                )
                .fromTo('.submit-footer', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3');
        }, rootRef);
        return () => ctx.revert();
    }, []);

    return (
        <div className="submit-flow__screen" ref={rootRef}>
            <h1 className="submit-flow__title">ADD YOUR STORY</h1>
            <p className="submit-flow__prompt-echo">"{prompt.text}"</p>

            <FormatSwitcher active={activeFormat} onSwitch={onSwitchFormat} />

            <div className="submit-flow__input-area">
                <textarea
                    className="text-step__area"
                    placeholder="Add text here..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={8}
                />
                <SubmitFooter
                    userType={userType}
                    onUserTypeChange={onUserTypeChange}
                    onSubmit={onSubmit}
                    submitting={submitting}
                    disabled={!value.trim()}
                />
            </div>
        </div>
    );
};

export default TextStep;