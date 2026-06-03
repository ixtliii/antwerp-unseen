import { useLanguage } from '../../../context/LanguageContext';
import './footer.css';

const Footer = () => {
    const { t } = useLanguage();
    return (
        <footer className="footer">
            <p className="footer__tagline">{t.footer.tagline}</p>
            <a className="footer__contact" href={`mailto:${t.footer.contact}`}>
                {t.footer.contact}
            </a>
            <p className="footer__rights">{t.footer.rights}</p>
        </footer>
    );
};

export default Footer;
