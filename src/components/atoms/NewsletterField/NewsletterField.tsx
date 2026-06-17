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
            <button type="button" className="newsletter-field__btn" onClick={submit} aria-label="Subscribe">↗</button>
        </div>
    );
};

export default NewsletterField;