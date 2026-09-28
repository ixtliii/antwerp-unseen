import { useRef, useState } from 'react';
import gsap from 'gsap';
import './newsletterField.css';

interface NewsletterFieldProps {
    onSubmit: (email: string) => void;
}

const NewsletterField = ({ onSubmit }: NewsletterFieldProps) => {
    const fieldRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState('');

    const submit = () => {
        if (!email.trim()) return;
        gsap.fromTo(fieldRef.current,
            { '--field-line': '#02d77b' } as gsap.TweenVars,
            { duration: 0.4, yoyo: true, repeat: 1 });
        onSubmit(email.trim());
        setEmail('');
    };

    return (
        <div className="newsletter-field" ref={fieldRef}>
            <input
                className="newsletter-field__input"
                type="email"
                placeholder="Email adress"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <button type="button" className="newsletter-field__btn" onClick={submit} aria-label="Subscribe">
                <svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.41739e-09 6.52841L19.469 6.53066" stroke="#DBE3EE" stroke-width="2"/>
                    <path d="M13.8223 12.7383L20.0508 6.40788L13.8223 0.738281" stroke="#DBE3EE" stroke-width="2"/>
                </svg>

            </button>
        </div>
    );
};

export default NewsletterField;