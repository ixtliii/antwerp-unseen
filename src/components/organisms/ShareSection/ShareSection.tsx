import { Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import BlurText from '../../atoms/BlurText/BlurText';
import useScrollReveal from '../../../hooks/useScrollReveal';
import './shareSection.css';

// Current active prompt — in production this comes from the CMS/API
const CURRENT_PROMPT = 'What happened here that the street doesn\'t show anymore?';

const ShareSection = () => {
    const { t } = useLanguage();
    const sectionRef = useScrollReveal() as React.RefObject<HTMLElement>;

    return (
        <section
            className="share reveal-section"
            ref={sectionRef}
            aria-label="Share your story"
        >
            <div className="share__inner">
                <p className="share__eyebrow">
                    <BlurText>{t.share.eyebrow}</BlurText>
                </p>

                <div className="share__prompt-wrap">
                    <span className="share__prompt-label">{t.share.prompt}</span>
                    <blockquote className="share__prompt">
                        <BlurText delay={150} duration={1300}>
                            "{CURRENT_PROMPT}"
                        </BlurText>
                    </blockquote>
                </div>

                <div className="share__actions">
                    <BlurText delay={400}>
                        <Link to="/submit" className="share__cta">
                            {t.share.cta}
                            <span aria-hidden>→</span>
                        </Link>
                    </BlurText>
                    <p className="share__note">
                        <BlurText delay={600} duration={900}>{t.share.note}</BlurText>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ShareSection;
