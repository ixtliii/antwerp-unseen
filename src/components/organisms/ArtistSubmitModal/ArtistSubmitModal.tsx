import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';
import './artistSubmitModal.css';

interface ArtistSubmitModalProps {
    onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILES = 6;

type Status = 'idle' | 'submitting' | 'success' | 'error';

const ArtistSubmitModal = ({ onClose }: ArtistSubmitModalProps) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<Status>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const emailValid = EMAIL_RE.test(email.trim());
    const canSubmit =
        name.trim().length > 0 &&
        emailValid &&
        files.length > 0 &&
        status !== 'submitting';

    const addFiles = (incoming: FileList | null) => {
        if (!incoming) return;
        const next = [...files, ...Array.from(incoming)].slice(0, MAX_FILES);
        setFiles(next);
    };

    const removeFile = (idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setStatus('submitting');
        setErrorMsg(null);

        try {
            // Upload each file to the artist-works bucket, collect public URLs.
            const urls: string[] = [];
            for (const file of files) {
                const ext = file.name.split('.').pop() ?? 'bin';
                const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                const { error: upErr } = await supabase.storage
                    .from('artist-works')
                    .upload(path, file, { upsert: false });
                if (upErr) throw upErr;

                const { data: urlData } = supabase.storage
                    .from('artist-works')
                    .getPublicUrl(path);
                urls.push(urlData.publicUrl);
            }

            const { error: insErr } = await supabase.from('artist_submissions').insert({
                name: name.trim(),
                email: email.trim(),
                description: description.trim() || null,
                file_urls: urls,
            });
            if (insErr) throw insErr;

            setStatus('success');
        } catch (err) {
            console.error('Artist submission failed:', err);
            setErrorMsg('Something went wrong. Please try again.');
            setStatus('error');
        }
    };

    return (
        <motion.div
            className="artist-submit-overlay"
            initial={{ backgroundColor: 'rgba(4, 4, 4, 0)', backdropFilter: 'blur(0px)' }}
            animate={{ backgroundColor: 'rgba(4, 4, 4, 0.98)', backdropFilter: 'blur(12px)' }}
            exit={{ backgroundColor: 'rgba(4, 4, 4, 0)', backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
            <div className="artist-submit__top-bar">
                <button
                    type="button"
                    className="artist-submit__close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ←
                </button>
            </div>

            <div className="artist-submit__content">
                {status === 'success' ? (
                    <motion.div
                        className="artist-submit__success"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <span className="artist-submit__success-mark" aria-hidden />
                        <h1 className="artist-submit__title">SUBMISSION RECEIVED</h1>
                        <p className="artist-submit__desc">
                            Thank you. We'll review your work and reach out via the email you provided.
                        </p>
                        <button type="button" className="artist-submit__btn artist-submit__btn--ghost" onClick={onClose}>
                            CLOSE
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        className="artist-submit__form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <header className="artist-submit__header">
                            <h1 className="artist-submit__title">SUBMIT YOUR WORK</h1>
                            <p className="artist-submit__desc">
                                Local artist? Share your work to be considered for the archive.
                                No account needed — just your details below.
                            </p>
                        </header>

                        <label className="artist-submit__field">
                            <span className="artist-submit__label">Name *</span>
                            <input
                                type="text"
                                className="artist-submit__input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                            />
                        </label>

                        <label className="artist-submit__field">
                            <span className="artist-submit__label">Email *</span>
                            <input
                                type="email"
                                className={`artist-submit__input ${email.length > 0 && !emailValid ? 'is-invalid' : ''}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                            />
                            {email.length > 0 && !emailValid && (
                                <span className="artist-submit__hint">Enter a valid email address</span>
                            )}
                        </label>

                        <label className="artist-submit__field">
                            <span className="artist-submit__label">About your work</span>
                            <textarea
                                className="artist-submit__textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell us a little about your practice and what you're submitting..."
                                rows={4}
                            />
                        </label>

                        <div className="artist-submit__field">
                            <span className="artist-submit__label">Your work * (up to {MAX_FILES} files)</span>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="artist-submit__file-input"
                                onChange={(e) => addFiles(e.target.files)}
                            />
                            <button
                                type="button"
                                className="artist-submit__upload-btn"
                                onClick={() => inputRef.current?.click()}
                                disabled={files.length >= MAX_FILES}
                            >
                                {files.length === 0 ? 'CHOOSE FILES' : 'ADD MORE'}
                            </button>

                            {files.length > 0 && (
                                <ul className="artist-submit__file-list">
                                    {files.map((f, i) => (
                                        <li key={`${f.name}-${i}`} className="artist-submit__file-item">
                                            <span className="artist-submit__file-name">{f.name}</span>
                                            <button
                                                type="button"
                                                className="artist-submit__file-remove"
                                                onClick={() => removeFile(i)}
                                                aria-label={`Remove ${f.name}`}
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {errorMsg && <p className="artist-submit__error">{errorMsg}</p>}

                        <button
                            type="button"
                            className="artist-submit__btn artist-submit__btn--primary"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                        >
                            {status === 'submitting' ? 'SUBMITTING…' : 'SUBMIT'}
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default ArtistSubmitModal;