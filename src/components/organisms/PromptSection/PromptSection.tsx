import { useState, type ChangeEvent } from 'react';
import { useLanguage } from '../../../context/LanguageContext.tsx';
import './promptSection.css';

type MediaType = 'photo' | 'video' | 'voice' | 'text' | 'music';

const QUESTIONS = [
    { id: 'q1', label: 'Question 1:', placeholder: '' },
    { id: 'q2', label: 'Question 2:', placeholder: '' },
    { id: 'q3', label: 'Question 3:', placeholder: '' },
    { id: 'q4', label: 'Question 4:', placeholder: '' },
    { id: 'q5', label: 'Question 5:', placeholder: '' },
];

const MEDIA_TYPES: { type: MediaType; icon: string; label: string }[] = [
    { type: 'photo', icon: '⬜', label: 'Photo'  },
    { type: 'video', icon: '▶',  label: 'Video'  },
    { type: 'voice', icon: '🎙', label: 'Voice'  },
    { type: 'text',  icon: 'T',  label: 'Text'   },
    { type: 'music', icon: '♪',  label: 'Music'  },
];

const PromptSection = () => {
    const { t } = useLanguage();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [mediaType, setMediaType] = useState<MediaType | null>(null);

    const handleAnswer = (id: string, e: ChangeEvent<HTMLInputElement>) => {
        setAnswers(prev => ({ ...prev, [id]: e.target.value }));
    };

    const handleSubmit = () => {
        // TODO: wire to API
        console.log({ answers, mediaType });
    };

    return (
        <section className="prompt" aria-label="Share your story">
            <div className="prompt__inner">
                <div className="prompt__header">
                    <h2 className="prompt__title">{t.share.title}</h2>
                    <p className="prompt__subtitle">
                        Respond to any of the questions below, then attach your contribution.
                    </p>
                </div>

                {/* Question grid */}
                <div className="prompt__grid">
                    {QUESTIONS.map(q => (
                        <div key={q.id} className="prompt__question">
                            <label
                                className="prompt__question-label"
                                htmlFor={q.id}
                            >
                                {q.label}
                            </label>
                            <input
                                id={q.id}
                                type="text"
                                className="prompt__question-input"
                                value={answers[q.id] ?? ''}
                                onChange={e => handleAnswer(q.id, e)}
                                placeholder="Your answer..."
                            />
                        </div>
                    ))}
                </div>

                {/* Media type selector */}
                <div className="prompt__media" role="group" aria-label="Attach media type">
                    {MEDIA_TYPES.map(({ type, icon, label }) => (
                        <button
                            key={type}
                            className={`prompt__media-btn${mediaType === type ? ' prompt__media-btn--active' : ''}`}
                            onClick={() => setMediaType(type)}
                            aria-pressed={mediaType === type}
                            aria-label={label}
                        >
                            <span className="prompt__media-icon" aria-hidden>{icon}</span>
                        </button>
                    ))}
                </div>

                <button className="prompt__submit" onClick={handleSubmit}>
                    SUBMIT
                </button>
            </div>
        </section>
    );
};

export default PromptSection;