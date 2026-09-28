import { useState, type FormEvent } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import './footer.css';

interface FooterProps {
    light?: boolean;
}

const Footer = ({ light = false }: FooterProps) => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');

    const handleNewsletter = (e: FormEvent) => {
        e.preventDefault();
        // TODO: wire to email service
        console.log('subscribe:', email);
        setEmail('');
    };

    return (
        <footer className={`footer${light ? ' footer--light' : ''}`}>

            {/* ─── Top row: Contact + Socials ─── */}
            <div className="footer__top">
                <div className="footer__col">
                    <h3 className="footer__col-title">CONTACT US</h3>
                    <ul className="footer__list">
                        <li>
                            <a href="tel:+3248422154" className="footer__link">
                                <span className="footer__link-icon" aria-hidden>☎</span>
                                +32 484 22 15 45
                            </a>
                        </li>
                        <li>
                            <a href="mailto:antwerpcunseen@gmail.com" className="footer__link">
                                <span className="footer__link-icon" aria-hidden>@</span>
                                antwerpcunseen@gmail.com
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="footer__col footer__col--right">
                    <h3 className="footer__col-title">SOCIALS</h3>
                    <ul className="footer__list">
                        <li>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noreferrer"
                                className="footer__link footer__link--social"
                            >
                                Instagram
                                <span className="footer__link-arrow" aria-hidden>↗</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noreferrer"
                                className="footer__link footer__link--social"
                            >
                                LinkedIn
                                <span className="footer__link-arrow" aria-hidden>↗</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* ─── Newsletter ─── */}
            <div className="footer__newsletter">
                <p className="footer__newsletter-label">STAY IN TUNE FOR NEW LOCATIONS!</p>
                <form className="footer__newsletter-form" onSubmit={handleNewsletter}>
                    <input
                        type="email"
                        className="footer__newsletter-input"
                        placeholder="EMAIL ADDRESS"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        aria-label="Email address for newsletter"
                    />
                    <button type="submit" className="footer__newsletter-btn" aria-label="Subscribe">
                        ↗
                    </button>
                </form>
            </div>

            {/* ─── Big type stamp ─── */}
            <div className="footer__stamp">
                <span className="footer__stamp-bold">ANTWERP</span>
                <span className="footer__stamp-italic"> UNSEEN.</span>
                <span className="footer__stamp-year">{t.footer.rights.split('©')[1]?.trim().split(' ')[0] ?? '2026'}©</span>
            </div>

        </footer>
    );
};

export default Footer;