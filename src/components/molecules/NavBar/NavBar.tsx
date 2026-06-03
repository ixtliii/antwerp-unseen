import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import './navBar.css';

const NavBar = () => {
    const { lang, setLang, t } = useLanguage();

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `navbar__link${isActive ? ' navbar__link--active' : ''}`;

    return (
        <header className="navbar">
            <NavLink to="/" className="navbar__logo" aria-label="Antwerp Unseen — home">
                ANTWERP UNSEEN
            </NavLink>

            <nav aria-label={t.a11y.navMenu}>
                <ul className="navbar__links">
                    <li><NavLink to="/"            className={linkClass} end>{t.nav.home}</NavLink></li>
                    <li><NavLink to="/explore"     className={linkClass}>{t.nav.archive}</NavLink></li>
                    <li><NavLink to="/installation" className={linkClass}>{t.nav.installation}</NavLink></li>
                    <li><NavLink to="/submit"      className={linkClass}>{t.nav.submit}</NavLink></li>
                </ul>
            </nav>

            <button
                className="navbar__lang"
                onClick={() => setLang(lang === 'en' ? 'nl' : 'en')}
                aria-label={t.a11y.langSwitch}
            >
                <span className={lang === 'en' ? 'navbar__lang-opt--active' : 'navbar__lang-opt'}>EN</span>
                <span className="navbar__lang-sep" aria-hidden>|</span>
                <span className={lang === 'nl' ? 'navbar__lang-opt--active' : 'navbar__lang-opt'}>NL</span>
            </button>
        </header>
    );
};

export default NavBar;
